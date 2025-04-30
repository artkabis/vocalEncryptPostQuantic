// visualizers.js - Classes pour la visualisation audio en temps réel

/**
 * Classe de base pour les visualiseurs audio
 */
class AudioVisualizer {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) {
        console.error(`Canvas element with ID "${canvasId}" not found`);
        return;
      }
      
      this.ctx = this.canvas.getContext('2d');
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      
      // S'assurer que le canvas est responsive
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width !== this.width) {
        this.canvas.width = rect.width;
        this.width = rect.width;
      }
    }
    
    clear() {
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
    }
  }
  
  /**
   * Visualiseur de forme d'onde audio
   * Affiche l'évolution temporelle du signal audio
   */
  class WaveformVisualizer extends AudioVisualizer {
    constructor(canvasId) {
      super(canvasId);
      
      // Vérifier si le canvas existe et si le contexte est défini
      if (!this.canvas || !this.ctx) {
        console.error(`Impossible d'initialiser WaveformVisualizer: Canvas "${canvasId}" non trouvé ou contexte non disponible`);
        return;
      }
      
      // Paramètres spécifiques à la forme d'onde
      this.lineWidth = 2;
      this.strokeStyle = '#bb86fc'; // couleur primaire
      this.fadingEffect = true;
      this.history = []; // stocke les formes d'onde précédentes pour l'effet de fondu
      this.maxHistoryLength = 3;
    }
    
    update(dataArray) {
      if (!this.ctx) return;
      
      this.clear();
      
      // Si pas de données, ne rien faire
      if (!dataArray || dataArray.length === 0) return;
      
      // Ajouter les données actuelles à l'historique
      if (this.fadingEffect) {
        this.history.unshift(new Uint8Array(dataArray));
        if (this.history.length > this.maxHistoryLength) {
          this.history.pop();
        }
      }
      
      // Dessiner l'historique avec un effet de fondu
      if (this.fadingEffect) {
        for (let h = this.history.length - 1; h >= 0; h--) {
          this.drawWaveform(this.history[h], h);
        }
      } else {
        this.drawWaveform(dataArray, 0);
      }
    }
    
    drawWaveform(dataArray, historyIndex) {
      if (!this.ctx) return;
      
      const bufferLength = dataArray.length;
      const sliceWidth = this.width / bufferLength;
      
      // Calculer l'opacité basée sur l'index d'historique
      const opacity = this.fadingEffect ? 1 - (historyIndex * 0.3) : 1;
      
      this.ctx.beginPath();
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeStyle = historyIndex === 0 ? 
        this.strokeStyle : 
        this.hexToRgba(this.strokeStyle, opacity);
      
      // Dessiner la ligne centrale
      if (historyIndex === 0) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.moveTo(0, this.height / 2);
        this.ctx.lineTo(this.width, this.height / 2);
        this.ctx.stroke();
      }
      
      // Dessiner la forme d'onde
      this.ctx.beginPath();
      this.ctx.moveTo(0, (this.height / 2) * (1 - ((dataArray[0] / 128.0) - 1)));
      
      for (let i = 1; i < bufferLength; i++) {
        const x = i * sliceWidth;
        const y = (this.height / 2) * (1 - ((dataArray[i] / 128.0) - 1));
        this.ctx.lineTo(x, y);
      }
      
      this.ctx.stroke();
      
      // Ajouter un effet de lueur pour les données actuelles
      if (historyIndex === 0) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.strokeStyle;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }
    }
    
    // Convertir couleur HEX en RGBA pour gérer l'opacité
    hexToRgba(hex, opacity) {
      let r = 0, g = 0, b = 0;
      
      // Si le format est #RRGGBB
      if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      } 
      // Si le format est #RGB
      else if (hex.length === 4) {
        r = parseInt(hex.substring(1, 2), 16) * 17;
        g = parseInt(hex.substring(2, 3), 16) * 17;
        b = parseInt(hex.substring(3, 4), 16) * 17;
      }
      
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  /**
   * Visualiseur de spectrogramme
   * Affiche la répartition des fréquences du signal audio
   */
  class SpectrogramVisualizer extends AudioVisualizer {
    constructor(canvasId) {
      super(canvasId);
      
      // Vérifier si le canvas existe et si le contexte est défini
      if (!this.canvas || !this.ctx) {
        console.error(`Impossible d'initialiser SpectrogramVisualizer: Canvas "${canvasId}" non trouvé ou contexte non disponible`);
        return;
      }
      
      // Paramètres du spectrogramme
      this.barWidth = 4;
      this.barSpacing = 1;
      this.maxFreqHeight = this.height - 10;
      this.gradientColors = [
        { pos: 0.0, color: '#121212' }, // très faible intensité
        { pos: 0.1, color: '#311b92' }, // faible intensité
        { pos: 0.3, color: '#6200ee' }, // intensité moyenne-faible
        { pos: 0.5, color: '#bb86fc' }, // intensité moyenne
        { pos: 0.7, color: '#03dac6' }, // intensité moyenne-élevée
        { pos: 0.9, color: '#64ffda' }, // intensité élevée
        { pos: 1.0, color: '#ffffff' }  // intensité maximale
      ];
      
      // Créer le gradient de couleur
      this.createGradient();
    }
    
    createGradient() {
      if (!this.ctx) return;
      
      this.gradient = this.ctx.createLinearGradient(0, this.height, 0, 0);
      if (this.gradient && this.gradientColors) {
        this.gradientColors.forEach(gc => {
          this.gradient.addColorStop(gc.pos, gc.color);
        });
      }
    }
    
    resize() {
      super.resize();
      // Recréer le gradient si la taille change
      if (this.ctx) {
        this.maxFreqHeight = this.height - 10;
        this.createGradient();
      }
    }
    
    update(dataArray) {
      if (!this.ctx || !this.gradient) return;
      
      this.clear();
      
      // Si pas de données, ne rien faire
      if (!dataArray || dataArray.length === 0) return;
      
      // Nombre de barres basé sur la taille du canvas et la largeur des barres
      const totalBars = Math.min(dataArray.length, Math.floor(this.width / (this.barWidth + this.barSpacing)));
      const frequencyStep = Math.floor(dataArray.length / totalBars) || 1;
      
      // Dessiner les barres de fréquence
      for (let i = 0; i < totalBars; i++) {
        const freqIndex = i * frequencyStep;
        const value = dataArray[freqIndex];
        const percent = value / 255;
        const barHeight = percent * this.maxFreqHeight;
        const x = i * (this.barWidth + this.barSpacing);
        const y = this.height - barHeight;
        
        // Dessiner la barre avec un dégradé
        this.ctx.fillStyle = this.gradient;
        this.ctx.fillRect(x, y, this.barWidth, barHeight);
        
        // Ajouter un effet de brillance pour les hautes amplitudes
        if (percent > 0.7) {
          this.ctx.fillStyle = `rgba(255, 255, 255, ${(percent - 0.7) / 0.3 * 0.3})`;
          this.ctx.fillRect(x, y, this.barWidth, 2);
        }
      }
      
      // Dessiner les lignes de référence horizontales
      this.drawReferenceLines();
    }
    
    drawReferenceLines() {
      if (!this.ctx) return;
      
      // Dessiner quelques lignes de référence horizontales
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = 1;
      
      const lines = 4; // Nombre de lignes
      for (let i = 1; i <= lines; i++) {
        const y = this.height - (i * (this.height / (lines + 1)));
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.width, y);
        this.ctx.stroke();
      }
    }
  }
  
  /**
   * Visualiseur de compteur d'entropie
   * Affiche un indicateur visuel du niveau d'entropie collecté
   */
  class EntropyMeter extends AudioVisualizer {
    constructor(canvasId) {
      super(canvasId);
      
      // Vérifier si le canvas existe et si le contexte est défini
      if (!this.canvas || !this.ctx) {
        console.error(`Impossible d'initialiser EntropyMeter: Canvas "${canvasId}" non trouvé ou contexte non disponible`);
        return;
      }
      
      // Paramètres du compteur d'entropie
      this.targetEntropy = 256; // Bits d'entropie cible
      this.currentEntropy = 0;
      this.segments = 20; // Nombre de segments dans le compteur
      this.segmentWidth = 15;
      this.segmentSpacing = 3;
      this.segmentColors = [
        { threshold: 0.2, color: '#cf6679' }, // Faible entropie - rouge
        { threshold: 0.5, color: '#ffab40' }, // Entropie moyenne - orange
        { threshold: 0.8, color: '#03dac6' }, // Bonne entropie - turquoise
        { threshold: 1.0, color: '#bb86fc' }  // Entropie excellente - violet
      ];
      
      // Dessiner le compteur initial
      this.update(0);
    }
    
    update(entropyBits) {
      if (!this.ctx) return;
      
      this.currentEntropy = entropyBits;
      this.clear();
      
      // Calculer le pourcentage d'entropie atteint
      const entropyPercentage = Math.min(1, this.currentEntropy / this.targetEntropy);
      
      // Calculer le nombre de segments complets
      const completeSegments = Math.floor(entropyPercentage * this.segments);
      
      // Calculer le pourcentage du segment partiel
      const partialSegment = (entropyPercentage * this.segments) - completeSegments;
      
      // La largeur totale du compteur
      const totalWidth = this.segments * (this.segmentWidth + this.segmentSpacing) - this.segmentSpacing;
      
      // Position de départ centrée
      const startX = (this.width - totalWidth) / 2;
      
      // Hauteur du segment
      const segmentHeight = this.height * 0.6;
      const y = (this.height - segmentHeight) / 2;
      
      // Dessiner les segments
      for (let i = 0; i < this.segments; i++) {
        const x = startX + i * (this.segmentWidth + this.segmentSpacing);
        const segmentPercentage = (i + 1) / this.segments;
        
        // Déterminer la couleur du segment
        const color = this.getSegmentColor(segmentPercentage);
        
        // Définir l'opacité du segment
        let opacity = 0.2; // Segments inactifs
        
        if (i < completeSegments) {
          opacity = 1; // Segments complets
        } else if (i === completeSegments) {
          opacity = 0.2 + (0.8 * partialSegment); // Segment partiel
        }
        
        // Dessiner le segment
        this.ctx.fillStyle = this.hexToRgba(color, opacity);
        this.ctx.beginPath();
        // Vérifier si roundRect est disponible (pour la compatibilité du navigateur)
        if (this.ctx.roundRect) {
          this.ctx.roundRect(x, y, this.segmentWidth, segmentHeight, 3);
        } else {
          // Fallback pour les navigateurs sans support de roundRect
          this.drawRoundRect(x, y, this.segmentWidth, segmentHeight, 3);
        }
        this.ctx.fill();
        
        // Ajouter un effet de lueur pour les segments actifs
        if (opacity > 0.2) {
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = color;
          this.ctx.beginPath();
          if (this.ctx.roundRect) {
            this.ctx.roundRect(x, y, this.segmentWidth, segmentHeight, 3);
          } else {
            this.drawRoundRect(x, y, this.segmentWidth, segmentHeight, 3);
          }
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      }
      
      // Dessiner le texte d'entropie
      this.drawEntropyText(entropyPercentage);
    }
    
    // Méthode de fallback pour les navigateurs sans roundRect
    drawRoundRect(x, y, width, height, radius) {
      if (!this.ctx) return;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
      this.ctx.closePath();
    }
    
    getSegmentColor(percentage) {
      // Déterminer la couleur en fonction du seuil de pourcentage
      for (let i = 0; i < this.segmentColors.length; i++) {
        if (percentage <= this.segmentColors[i].threshold) {
          return this.segmentColors[i].color;
        }
      }
      return this.segmentColors[this.segmentColors.length - 1].color;
    }
    
    drawEntropyText(percentage) {
      if (!this.ctx) return;
      
      const entropyStatus = this.getEntropyStatus(percentage);
      
      this.ctx.font = '12px "Roboto", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillText(entropyStatus, this.width / 2, this.height - 5);
    }
    
    getEntropyStatus(percentage) {
      if (percentage < 0.25) {
        return 'Entropie faible';
      } else if (percentage < 0.5) {
        return 'Entropie moyenne';
      } else if (percentage < 0.75) {
        return 'Bonne entropie';
      } else if (percentage < 0.95) {
        return 'Très bonne entropie';
      } else {
        return 'Entropie optimale';
      }
    }
    
    hexToRgba(hex, opacity) {
      let r = 0, g = 0, b = 0;
      
      // Si le format est #RRGGBB
      if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      } 
      // Si le format est #RGB
      else if (hex.length === 4) {
        r = parseInt(hex.substring(1, 2), 16) * 17;
        g = parseInt(hex.substring(2, 3), 16) * 17;
        b = parseInt(hex.substring(3, 4), 16) * 17;
      }
      
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }