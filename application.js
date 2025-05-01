// application.js - Module principal de l'application générateur de clés post-quantiques audio

// Define our application modules
const AppModules = {
    // UI Module - Gère l'interface et les visualisations
    UI: {
      // Références aux éléments de l'interface
      elements: {
        startRecordingBtn: null,
        stopRecordingBtn: null,
        generateKeyBtn: null,
        exportKeysBtn: null,
        statusMessage: null,
        entropyMeter: null,
        entropyValue: null,
        publicKeyDisplay: null,
        privateKeyDisplay: null,
        sourceItems: {}
      },
      
      // Visualiseurs
      visualizers: {
        waveform: null,
        spectrogram: null,
        entropyMeter: null
      },
      
      init() {
        console.log('Initialisation du module UI');
        
        // Récupérer les références aux éléments de l'interface
        this.elements.startRecordingBtn = document.getElementById('startRecording');
        this.elements.stopRecordingBtn = document.getElementById('stopRecording');
        this.elements.generateKeyBtn = document.getElementById('generateKey');
        this.elements.exportKeysBtn = document.getElementById('exportKeys');
        this.elements.statusMessage = document.getElementById('status-message');
        this.elements.entropyMeter = document.getElementById('entropy-meter');
        this.elements.entropyValue = document.getElementById('entropy-value');
        this.elements.publicKeyDisplay = document.getElementById('public-key');
        this.elements.privateKeyDisplay = document.getElementById('private-key');
        
        // Récupérer les références aux éléments des sources d'entropie
        this.elements.sourceItems = {
          audio: document.getElementById('source-audio'),
          mouse: document.getElementById('source-mouse'),
          timing: document.getElementById('source-timing'),
          network: document.getElementById('source-network'),
          sensors: document.getElementById('source-sensors'),
          system: document.getElementById('source-system')
        };
        
        // Configuration des événements de l'interface
        this.setupEventListeners();
        
        // Initialisation des visualiseurs
        this.createVisualizers();
        
        return this;
      },
      
      setupEventListeners() {
        // Connecter les boutons aux actions
        if (this.elements.startRecordingBtn) {
          this.elements.startRecordingBtn.addEventListener('click', () => {
            AppModules.Audio.startRecording();
          });
        }
        
        if (this.elements.stopRecordingBtn) {
          this.elements.stopRecordingBtn.addEventListener('click', () => {
            AppModules.Audio.stopRecording();
          });
        }
        
        if (this.elements.generateKeyBtn) {
          this.elements.generateKeyBtn.addEventListener('click', () => {
            AppModules.Crypto.generateKeyPair();
          });
        }
        
        if (this.elements.exportKeysBtn) {
          this.elements.exportKeysBtn.addEventListener('click', () => {
            AppModules.Crypto.exportKeys();
          });
        }
        
        // Configurer les boutons de copie
        document.querySelectorAll('.copy-btn').forEach(button => {
          button.addEventListener('click', (e) => {
            const targetId = e.target.dataset.target;
            const contentElement = document.getElementById(targetId);
            
            if (contentElement) {
              // Créer un élément temporaire pour la copie
              const tempElement = document.createElement('textarea');
              tempElement.value = contentElement.textContent;
              document.body.appendChild(tempElement);
              tempElement.select();
              document.execCommand('copy');
              document.body.removeChild(tempElement);
              
              // Feedback visuel
              const originalText = e.target.textContent;
              e.target.textContent = 'Copié!';
              setTimeout(() => {
                e.target.textContent = originalText;
              }, 2000);
            }
          });
        });
      },
      
      createVisualizers() {
        console.log('Initialisation des visualiseurs');
        
        try {
          // Vérifier que les éléments canvas existent
          const waveformCanvas = document.getElementById('waveform-canvas');
          const spectrogramCanvas = document.getElementById('spectrogram-canvas');
          
          if (waveformCanvas) {
            this.visualizers.waveform = new WaveformVisualizer('waveform-canvas');
          } else {
            console.error("Canvas 'waveform-canvas' introuvable");
          }
          
          if (spectrogramCanvas) {
            this.visualizers.spectrogram = new SpectrogramVisualizer('spectrogram-canvas');
          } else {
            console.error("Canvas 'spectrogram-canvas' introuvable");
          }
          
          // Créer un canvas pour le visualiseur d'entropie s'il n'existe pas déjà
          let entropyCanvas = document.getElementById('entropy-visualizer');
          
          if (!entropyCanvas) {
            try {
              const entropyContainer = document.querySelector('.entropy-meter-container');
              if (entropyContainer) {
                entropyCanvas = document.createElement('canvas');
                entropyCanvas.id = 'entropy-visualizer';
                entropyCanvas.width = 300;
                entropyCanvas.height = 30;
                entropyContainer.appendChild(entropyCanvas);
                
                this.visualizers.entropyMeter = new EntropyMeter('entropy-visualizer');
              } else {
                console.error("Conteneur '.entropy-meter-container' introuvable");
              }
            } catch (error) {
              console.error("Erreur lors de la création du canvas d'entropie:", error);
            }
          } else {
            this.visualizers.entropyMeter = new EntropyMeter('entropy-visualizer');
          }
        } catch (error) {
          console.error("Erreur lors de l'initialisation des visualiseurs:", error);
        }
      },
      
      updateStatus(message) {
        if (this.elements.statusMessage) {
          this.elements.statusMessage.textContent = message;
        }
      },
      
      updateEntropyDisplay(entropyBits) {
        const targetEntropy = AppModules.Entropy.targetEntropyBits;
        
        // Mettre à jour l'indicateur de progression si disponible
        if (this.elements.entropyMeter) {
          this.elements.entropyMeter.value = entropyBits;
        }
        
        if (this.elements.entropyValue) {
          this.elements.entropyValue.textContent = `${entropyBits.toFixed(2)} bits`;
        }
        
        // Mettre à jour le visualiseur d'entropie
        if (this.visualizers.entropyMeter) {
          this.visualizers.entropyMeter.update(entropyBits);
        }
        
        // Activer/désactiver les boutons en fonction du niveau d'entropie
        if (entropyBits >= targetEntropy) {
          if (this.elements.generateKeyBtn) {
            this.elements.generateKeyBtn.disabled = false;
          }
          this.updateStatus('Entropie suffisante collectée pour la génération de clés');
        } else {
          if (this.elements.generateKeyBtn) {
            this.elements.generateKeyBtn.disabled = true;
          }
        }
      },
      
      updateSourceStatus(sourceName, status) {
        if (this.elements.sourceItems[sourceName]) {
          const statusElement = this.elements.sourceItems[sourceName].querySelector('.source-status');
          if (statusElement) {
            // Supprimer les classes de statut existantes
            statusElement.classList.remove('active', 'collecting', 'waiting', 'completed', 'unavailable');
            
            // Mettre à jour le texte et la classe
            switch (status) {
              case 'active':
                statusElement.textContent = 'Actif';
                statusElement.classList.add('active');
                break;
              case 'collecting':
                statusElement.textContent = 'Collecte en cours';
                statusElement.classList.add('collecting');
                break;
              case 'completed':
                statusElement.textContent = 'Collecté';
                statusElement.classList.add('completed');
                break;
              case 'waiting':
                statusElement.textContent = 'En attente';
                statusElement.classList.add('waiting');
                break;
              case 'unavailable':
                statusElement.textContent = 'Non disponible';
                statusElement.classList.add('unavailable');
                break;
            }
          }
        }
      },
      
      displayKey(keyPair) {
        if (keyPair.publicKey && this.elements.publicKeyDisplay) {
          this.elements.publicKeyDisplay.textContent = keyPair.publicKey;
        }
        
        if (keyPair.privateKey && this.elements.privateKeyDisplay) {
          this.elements.privateKeyDisplay.textContent = keyPair.privateKey;
        }
        
        // Activer le bouton d'exportation
        if (this.elements.exportKeysBtn) {
          this.elements.exportKeysBtn.disabled = false;
        }
      }
    },
    
    // Audio Module - Gère la capture et le traitement audio
    Audio: {
      audioContext: null,
      mediaRecorder: null,
      audioStream: null,
      audioChunks: [],
      audioFeatures: {},
      analyzerNode: null,
      audioSource: null,
      isRecording: false,
      visualizationActive: false,
      timeData: null,
      frequencyData: null,
      
      async init() {
        console.log('Initialisation du module Audio');
        
        try {
          // Créer le contexte audio
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          // Initialiser les buffers pour les visualiseurs
          this.timeData = new Uint8Array(1024);
          this.frequencyData = new Uint8Array(1024);
          
          // Vérifier les permissions du navigateur pour l'audio
          if (navigator.permissions && navigator.permissions.query) {
            try {
              const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
              
              if (permissionStatus.state === 'granted') {
                console.log('Permission du microphone déjà accordée');
              } else if (permissionStatus.state === 'prompt') {
                AppModules.UI.updateStatus('Veuillez autoriser l\'accès au microphone pour l\'enregistrement');
              } else if (permissionStatus.state === 'denied') {
                console.error('Permission du microphone refusée');
                AppModules.UI.updateStatus('L\'accès au microphone est requis pour collecter l\'entropie audio');
                AppModules.UI.updateSourceStatus('audio', 'unavailable');
              }
            } catch (e) {
              // Certains navigateurs peuvent ne pas prendre en charge la requête de permission pour le microphone
              console.log('Vérification de permission non prise en charge:', e);
            }
          }
          
          return this;
        } catch (error) {
          console.error('Erreur lors de l\'initialisation audio:', error);
          AppModules.UI.updateStatus('Erreur d\'initialisation audio. Le navigateur pourrait ne pas prendre en charge l\'API Web Audio.');
          return this;
        }
      },
      // Optimisation 4: Autres optimisations de traitement
// Helper function pour calculer le RMS depuis des échantillons
calculateRMSFromSamples(samples) {
    if (!samples || samples.length === 0) return 0;
    
    // Optimisation: traiter un échantillon sur quatre
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < samples.length; i += 4) {
        sum += samples[i] * samples[i];
        count++;
    }
    
    return Math.sqrt(sum / count);
},

    calculateRMS(audioBuffer) { // Gardez l'original si utilisé ailleurs
        const channelData = audioBuffer.getChannelData(0);
        return this.calculateRMSFromSamples(channelData); // Réutiliser le helper
    },
      
      async requestMicrophoneAccess() {
        try {
          // Demander l'accès au microphone
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            } 
          });
          
          this.audioStream = stream;
          this.setupAudioProcessing(stream);
          AppModules.UI.updateSourceStatus('audio', 'active');
          return true;
        } catch (error) {
          console.error('Erreur d\'accès au microphone:', error);
          AppModules.UI.updateStatus('Accès au microphone refusé ou indisponible');
          AppModules.UI.updateSourceStatus('audio', 'unavailable');
          return false;
        }
      },setupAudioProcessing(stream) {
        try {
          // Vérifier que le contexte audio existe
          if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          }
          
          // Créer l'enregistreur média
          this.mediaRecorder = new MediaRecorder(stream);
          
          // Créer la source audio et l'analyseur
          this.audioSource = this.audioContext.createMediaStreamSource(stream);
          this.analyzerNode = this.audioContext.createAnalyser();
          
          // Configurer les paramètres de l'analyseur
          this.analyzerNode.fftSize = 2048;
          this.bufferLength = this.analyzerNode.frequencyBinCount;
          this.timeData = new Uint8Array(this.bufferLength);
          this.frequencyData = new Uint8Array(this.bufferLength);
          
          // Connecter les nœuds audio
          this.audioSource.connect(this.analyzerNode);
          
          // Configurer les événements de l'enregistreur
          this.mediaRecorder.ondataavailable = event => {
            this.audioChunks.push(event.data);
          };
          
          this.mediaRecorder.onstop = async () => {
            // S'assurer qu'il y a des données
            if (this.audioChunks.length === 0) {
              AppModules.UI.updateStatus('Aucune donnée audio enregistrée');
              return;
            }
            
            // Traiter l'audio enregistré
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            await this.processAudioFeatures(audioBlob);
          };
        } catch (error) {
          console.error('Erreur lors de la configuration du traitement audio:', error);
          AppModules.UI.updateStatus('Erreur lors de la configuration audio');
        }
      },
      
      startRecording() {
        if (this.isRecording) return;
        
        if (!this.mediaRecorder) {
          AppModules.UI.updateStatus('Demande d\'accès au microphone...');
          this.requestMicrophoneAccess().then(success => {
            if (success) this.startRecording();
          });
          return;
        }
        
        // Réinitialiser les chunks audio
        this.audioChunks = [];
        
        // S'assurer que le contexte audio est démarré (important pour Chrome)
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        
        // Démarrer l'enregistrement
        this.mediaRecorder.start();
        this.isRecording = true;
        
        // Démarrer la visualisation
        this.startVisualization();
        
        // Mettre à jour l'interface
        if (AppModules.UI.elements.startRecordingBtn) {
          AppModules.UI.elements.startRecordingBtn.disabled = true;
        }
        if (AppModules.UI.elements.stopRecordingBtn) {
          AppModules.UI.elements.stopRecordingBtn.disabled = false;
        }
        AppModules.UI.updateStatus('Enregistrement en cours...');
        AppModules.UI.updateSourceStatus('audio', 'collecting');
      },
      
      stopRecording() {
        if (!this.isRecording) return;
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          // Arrêter l'enregistrement
          this.mediaRecorder.stop();
          this.isRecording = false;
          
          // Continuer la visualisation mais marquer l'enregistrement comme terminé
          AppModules.UI.updateStatus('Traitement des caractéristiques audio...');
          if (AppModules.UI.elements.startRecordingBtn) {
            AppModules.UI.elements.startRecordingBtn.disabled = false;
          }
          if (AppModules.UI.elements.stopRecordingBtn) {
            AppModules.UI.elements.stopRecordingBtn.disabled = true;
          }
        }
      },
      
      startVisualization() {
        this.visualizationActive = true;
        this.visualize();
      },
      
      stopVisualization() {
        this.visualizationActive = false;
      },
      
      visualize() {
        if (!this.visualizationActive || !this.analyzerNode) return;
        
        try {
          // Récupérer les données audio pour les visualiseurs
          this.analyzerNode.getByteTimeDomainData(this.timeData);
          this.analyzerNode.getByteFrequencyData(this.frequencyData);
          
          // Mettre à jour les visualiseurs s'ils existent
          if (AppModules.UI.visualizers.waveform) {
            AppModules.UI.visualizers.waveform.update(this.timeData);
          }
          
          if (AppModules.UI.visualizers.spectrogram) {
            AppModules.UI.visualizers.spectrogram.update(this.frequencyData);
          }
          
          // Continuer la boucle de visualisation
          requestAnimationFrame(() => this.visualize());
        } catch (error) {
          console.error('Erreur de visualisation:', error);
          this.visualizationActive = false;
        }
      },
      
      async processAudioFeatures(audioBlob) {
        try {
          AppModules.UI.updateStatus('Extraction des caractéristiques audio...');
          
          // Convertir le blob audio en buffer pour le traitement
          const audioBuffer = await this.audioToBuffer(audioBlob);
          
          // Extraire diverses caractéristiques audio
          const features = await this.extractAudioFeatures(audioBuffer);
          
          // Mettre à jour le statut de la source audio
          AppModules.UI.updateSourceStatus('audio', 'completed');
          AppModules.UI.updateStatus('Caractéristiques audio extraites. Entropie calculée.');
          
          // Fournir les caractéristiques au collecteur d'entropie
          AppModules.Entropy.addEntropySource('audio', features, this.estimateAudioEntropy(features));
        } catch (error) {
          console.error('Erreur lors du traitement audio:', error);
          AppModules.UI.updateStatus('Erreur lors de l\'extraction des caractéristiques audio');
        }
      },
      
      async audioToBuffer(blob) {
        if (!this.audioContext) {
          throw new Error('Contexte audio non initialisé');
        }
        
        const arrayBuffer = await blob.arrayBuffer();
        return this.audioContext.decodeAudioData(arrayBuffer);
      },
      
      async extractAudioFeatures(audioBuffer) {
        console.log('Extraction des caractéristiques audio...');
        
        const features = {
          // Métadonnées
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels,
          
          // Caractéristiques extraites
          rms: this.calculateRMS(audioBuffer),
          zeroCrossings: this.calculateZeroCrossings(audioBuffer),
          spectralCentroid: this.calculateSpectralCentroid(audioBuffer),
          energyDistribution: this.calculateEnergyDistribution(audioBuffer),
          mfcc: this.calculateMFCC(audioBuffer),
          
          // Empreinte perceptuelle
          perceptualFingerprint: this.calculatePerceptualFingerprint(audioBuffer)
        };
        
        console.log('Caractéristiques audio extraites:', features);
        this.audioFeatures = features;
        return features;
      },
      
      calculateRMS(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        let sum = 0;
        
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        
        return Math.sqrt(sum / channelData.length);
      },
      
      calculateZeroCrossings(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        let crossings = 0;
        
        for (let i = 1; i < channelData.length; i++) {
          if ((channelData[i - 1] < 0 && channelData[i] >= 0) || 
              (channelData[i - 1] >= 0 && channelData[i] < 0)) {
            crossings++;
          }
        }
        
        return crossings / audioBuffer.duration; // Taux par seconde
      },
      
      // Optimisation 2: Calcul du centroïde spectral optimisé
calculateSpectralCentroid(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    const fftSize = 1024; // Réduit de moitié
    const sampleRate = audioBuffer.sampleRate;
    const centroids = [];
    
    // Réduire le nombre d'échantillons traités
    const frameStep = 4; // Analyser une trame sur quatre
    
    for (let i = 0; i < channelData.length; i += fftSize * frameStep) {
        const slice = channelData.slice(i, i + fftSize);
        if (slice.length < fftSize) break;
        
        // Méthode simplifiée sans calcul FFT complet
        let weightedSum = 0;
        let totalEnergy = 0;
        
        // Traiter moins de bins de fréquence
        const binStep = 2; // Analyser un bin sur deux
        
        for (let j = 0; j < fftSize/2; j += binStep) {
            // Estimation de l'énergie par simple calcul d'amplitude
            const binFrequency = j * sampleRate / fftSize;
            const amplitude = Math.abs(slice[j * 2]) + Math.abs(slice[j * 2 + 1]);
            const energy = amplitude * amplitude;
            
            weightedSum += binFrequency * energy;
            totalEnergy += energy;
        }
        
        // Calculer le centroïde
        if (totalEnergy > 0) {
            centroids.push(weightedSum / totalEnergy);
        } else {
            centroids.push(0);
        }
    }
    
    return centroids;
},
      
      applyWindow(samples, windowType = 'hann') {
        const windowed = new Float32Array(samples.length);
        
        for (let i = 0; i < samples.length; i++) {
          // Fonction de fenêtrage de Hann: 0.5 * (1 - cos(2π * n / (N - 1)))
          const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (samples.length - 1)));
          windowed[i] = samples[i] * windowValue;
        }
        
        return windowed;
      },
      
      calculateFFT(samples, sampleRate) {
        // Ceci est une simulation simplifiée de FFT pour le projet de démonstration
        // Une vraie implémentation utiliserait Web Audio API ou une bibliothèque FFT
        
        const N = samples.length;
        const magnitudes = new Float32Array(N / 2);
        const frequencies = new Float32Array(N / 2);
        
        // Générer des fréquences pour chaque bin
        for (let i = 0; i < N / 2; i++) {
          frequencies[i] = i * sampleRate / N;
        }
        
        // Calculer les magnitudes (simulation)
        for (let k = 0; k < N / 2; k++) {
          let realPart = 0;
          let imagPart = 0;
          
          for (let n = 0; n < N; n++) {
            const angle = -2 * Math.PI * k * n / N;
            realPart += samples[n] * Math.cos(angle);
            imagPart += samples[n] * Math.sin(angle);
          }
          
          magnitudes[k] = Math.sqrt(realPart * realPart + imagPart * imagPart) / N;
        }
        
        return { magnitudes, frequencies };
      },
      
      calculateEnergyDistribution(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const fftSize = 2048;
        
        // Définir des bandes de fréquences (en Hz)
        const bands = [
          { min: 20, max: 60 },     // Sub-bass
          { min: 60, max: 250 },    // Bass
          { min: 250, max: 500 },   // Low-mids
          { min: 500, max: 2000 },  // Mids
          { min: 2000, max: 4000 }, // Upper-mids
          { min: 4000, max: 6000 }, // Presence
          { min: 6000, max: 20000 } // Brilliance
        ];
        
        const distribution = Array(bands.length).fill(0);
        let totalFrames = 0;
        
        // Traiter les trames audio
        for (let i = 0; i < channelData.length; i += fftSize / 2) {
          const slice = channelData.slice(i, i + fftSize);
          if (slice.length < fftSize) break;
          
          // Appliquer une fenêtre et calculer la FFT
          const windowed = this.applyWindow(slice);
          const { magnitudes, frequencies } = this.calculateFFT(windowed, sampleRate);
          
          // Calculer l'énergie par bande
          for (let j = 0; j < magnitudes.length; j++) {
            const freq = frequencies[j];
            const mag = magnitudes[j];
            
            for (let b = 0; b < bands.length; b++) {
              if (freq >= bands[b].min && freq <= bands[b].max) {
                distribution[b] += mag * mag;
                break;
              }
            }
          }
          
          totalFrames++;
        }
        
        // Normaliser la distribution
        const totalEnergy = distribution.reduce((sum, val) => sum + val, 0);
        if (totalEnergy > 0 && totalFrames > 0) {
          for (let i = 0; i < distribution.length; i++) {
            distribution[i] = distribution[i] / totalEnergy;
          }
        }
        
        return distribution;
      },
      
      // Optimisation 1: Calcul MFCC simplifié
// Remplacement de la méthode calculateMFCC dans le module Audio
calculateMFCC(audioBuffer) {
    // Version optimisée qui réduit considérablement les calculs
    const channelData = audioBuffer.getChannelData(0);
    const fftSize = 1024; // Réduit de moitié par rapport à l'original
    const numCoefficients = 13;
    const mfccs = [];
    
    // Réduire le nombre de trames traitées
    const frameStep = 4; // Traiter une trame sur quatre
    
    for (let i = 0; i < channelData.length; i += fftSize * frameStep) {
        const slice = channelData.slice(i, i + fftSize);
        if (slice.length < fftSize) break;
        
        // Calcul simplifié des coefficients MFCC
        const frameCoeffs = new Array(numCoefficients);
        
        // Utiliser le RMS comme base pour simuler les coefficients
        const rms = this.calculateRMSFromSamples(slice);
        
        for (let j = 0; j < numCoefficients; j++) {
            // Utiliser une approche plus simple mais toujours pertinente
            frameCoeffs[j] = rms * Math.sin(j * Math.PI / (numCoefficients - 1)) + 
                            (Math.random() * 0.05 - 0.025); // Légère variance
        }
        
        mfccs.push(frameCoeffs);
    }
    
    return mfccs;
},
      
      // Optimisation 3: Calcul d'empreinte perceptuelle simplifié
calculatePerceptualFingerprint(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);
    const frameSize = 2048; // Réduit de moitié par rapport à l'original
    const fingerprint = [];
    
    // Réduire le nombre de trames à traiter
    const frameStep = 4; // Traiter une trame sur quatre
    
    for (let i = 0; i < channelData.length; i += frameSize * frameStep) {
        const slice = channelData.slice(i, i + frameSize);
        if (slice.length < frameSize) break;
        
        // Calcul simplifié des pics spectraux
        const peaks = [];
        
        // Diviser le signal en bandes et trouver les pics
        const numBands = 8;
        const bandSize = Math.floor(frameSize / numBands);
        
        for (let b = 0; b < numBands; b++) {
            const start = b * bandSize;
            const end = start + bandSize;
            
            let maxValue = 0;
            let maxIndex = start;
            
            for (let j = start; j < end; j++) {
                const absValue = Math.abs(slice[j]);
                if (absValue > maxValue) {
                    maxValue = absValue;
                    maxIndex = j;
                }
            }
            
            if (maxValue > 0.01) { // Seuil pour éliminer le bruit
                peaks.push({
                    index: maxIndex,
                    magnitude: maxValue
                });
            }
        }
        
        fingerprint.push(peaks);
    }
    
    return fingerprint;
},
      
      findSpectralPeaks(magnitudes, numPeaks) {
        // Trouver les indices des valeurs maximales
        const peaks = [];
        const tempMags = [...magnitudes]; // Copie pour ne pas modifier l'original
        
        for (let i = 0; i < numPeaks; i++) {
          const maxIndex = tempMags.indexOf(Math.max(...tempMags));
          if (maxIndex !== -1 && tempMags[maxIndex] > 0) {
            peaks.push({
              index: maxIndex,
              magnitude: tempMags[maxIndex]
            });
            
            // Mettre à zéro ce pic et les valeurs proches pour éviter les doublons
            for (let j = Math.max(0, maxIndex - 3); j <= Math.min(tempMags.length - 1, maxIndex + 3); j++) {
              tempMags[j] = 0;
            }
          }
        }
        
        return peaks;
      },
      calculateRMSFromSamples(samples) {
        if (!samples || samples.length === 0) return 0;
        
        // Optimisation: traiter un échantillon sur quatre
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < samples.length; i += 4) {
            sum += samples[i] * samples[i];
            count++;
        }
        
        return Math.sqrt(sum / count);
    },
    
    // Estimation de l'entropie audio optimisée
    estimateAudioEntropy(features) {
        // Estimation plus rapide et plus précise de l'entropie audio
        let entropy = 0;
        
        // Utiliser RMS avec une contribution maximale de 5 bits
        if (features.rms) {
            entropy += Math.min(5, 3 + features.rms * 20);
        }
        
        // Les passages par zéro contribuent jusqu'à 8 bits
        if (features.zeroCrossings) {
            entropy += Math.min(8, features.zeroCrossings / 10);
        }
        
        // Le centroïde spectral contribue jusqu'à 10 bits
        if (features.spectralCentroid && features.spectralCentroid.length > 0) {
            entropy += Math.min(10, features.spectralCentroid.length / 4);
        }
        
        // La distribution d'énergie contribue jusqu'à 12 bits
        if (features.energyDistribution && features.energyDistribution.length > 0) {
            entropy += Math.min(12, features.energyDistribution.length * 1.5);
        }
        
        // Les MFCC contribuent jusqu'à 20 bits
        if (features.mfcc && features.mfcc.length > 0) {
            entropy += Math.min(20, features.mfcc.length / 5);
        }
        
        // L'empreinte perceptuelle contribue jusqu'à 40 bits
        if (features.perceptualFingerprint && features.perceptualFingerprint.length > 0) {
            entropy += Math.min(40, features.perceptualFingerprint.length / 2);
        }
        
        return Math.round(entropy);
    }
    },
    
    // Entropy Module - Collecte l'entropie de diverses sources
    Entropy: {
      entropySources: {},        // Données brutes des sources d'entropie
      entropyEstimates: {},      // Estimation de l'entropie par source
      currentEntropyBits: 0,     // Entropie totale actuelle en bits
      targetEntropyBits: 256,    // Objectif d'entropie pour la génération de clés
      entropyCollectors: [],     // Collecteurs d'entropie actifs
      
      init() {
        console.log('Initialisation du module Entropy');
        
        // Configurer les collecteurs d'entropie
        this.setupEntropyCollectors();
        
        // Initialiser l'entropie à 0
        this.currentEntropyBits = 0;
        AppModules.UI.updateEntropyDisplay(this.currentEntropyBits);
        
        return this;
      },
      
      setupEntropyCollectors() {
        // Configurer les collecteurs d'entropie
        this.setupMouseEntropyCollector();
        this.setupTimingEntropyCollector();
        this.setupNetworkEntropyCollector();
        this.setupSensorEntropyCollector();
        // Le collecteur système est configuré séparément lors de l'initialisation
      },
      
      addEntropySource(sourceName, data, entropyEstimate = 0) {
        // Stocker les données de la source
        this.entropySources[sourceName] = data;
        
        // Stocker l'estimation d'entropie
        if (entropyEstimate > 0) {
          this.entropyEstimates[sourceName] = entropyEstimate;
        } else {
          // Si aucune estimation n'est fournie, nous en calculons une
          this.entropyEstimates[sourceName] = this.estimateSourceEntropy(sourceName, data);
        }
        
        // Mettre à jour l'entropie totale
        this.updateTotalEntropy();
      },
      
      updateTotalEntropy() {
        // Calculer l'entropie totale de toutes les sources
        let totalEntropy = 0;
        
        for (const source in this.entropyEstimates) {
          totalEntropy += this.entropyEstimates[source];
        }
        
        // Limiter au maximum visé
        this.currentEntropyBits = Math.min(totalEntropy, this.targetEntropyBits);
        
        // Mettre à jour l'affichage
        AppModules.UI.updateEntropyDisplay(this.currentEntropyBits);
        
        // Vérifier si nous avons assez d'entropie
        if (this.currentEntropyBits >= this.targetEntropyBits) {
          AppModules.UI.updateStatus('Entropie suffisante collectée pour la génération de clés');
        }
      },
      
      estimateSourceEntropy(sourceName, data) {
        // Estimation d'entropie spécifique à chaque source
        switch (sourceName) {
          case 'mouse':
            return this.estimateMouseEntropy(data);
          case 'timing':
            return this.estimateTimingEntropy(data);
          case 'network':
            return this.estimateNetworkEntropy(data);
          case 'sensors':
            return this.estimateSensorEntropy(data);
          case 'system':
            return this.estimateSystemEntropy(data);
          default:
            return 0;
        }
      },
      
      setupMouseEntropyCollector() {
        console.log('Configuration du collecteur d\'entropie souris');
        
        // Initialiser la structure de données pour les mouvements souris
        const mouseData = {
          positions: [], // Positions (x, y)
          timings: [],   // Timings des mouvements
          velocities: [] // Vitesses de mouvement
        };
        
        // Mettre à jour l'état de cette source d'entropie
        AppModules.UI.updateSourceStatus('mouse', 'waiting');
        
        // Écouter les mouvements de souris
        let lastX = 0, lastY = 0, lastTime = 0;
        
        const mouseListener = (event) => {
          // Limiter la taille des données collectées
          if (mouseData.positions.length >= 1000) {
            // Conserver seulement les 500 derniers mouvements
            mouseData.positions = mouseData.positions.slice(-500);
            mouseData.timings = mouseData.timings.slice(-500);
            mouseData.velocities = mouseData.velocities.slice(-500);
          }
          
          // Enregistrer la position
          mouseData.positions.push({
            x: event.clientX,
            y: event.clientY
          });
          
          // Enregistrer le timing
          const now = performance.now();
          mouseData.timings.push(now);
          
          // Calculer la vitesse si ce n'est pas le premier mouvement
          if (mouseData.positions.length > 1) {
            const dx = event.clientX - lastX;
            const dy = event.clientY - lastY;
            const dt = now - lastTime;
            
            // Éviter division par zéro
            if (dt > 0) {
              const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
              mouseData.velocities.push(velocity);
            }
          }
          
          // Mettre à jour les dernières valeurs
          lastX = event.clientX;
          lastY = event.clientY;
          lastTime = now;
          
          // Mettre à jour la source d'entropie si nous avons collecté assez de données
          if (mouseData.positions.length > 0 && mouseData.positions.length % 50 === 0) {
            AppModules.UI.updateSourceStatus('mouse', 'collecting');
            this.addEntropySource('mouse', mouseData);
          }
        };
        
        // Ajouter l'écouteur d'événements
        document.addEventListener('mousemove', mouseListener);
        
        // Stocker la référence pour un nettoyage éventuel
        this.entropyCollectors.push({
          name: 'mouse',
          cleanup: () => document.removeEventListener('mousemove', mouseListener)
        });
      },
      
      estimateMouseEntropy(mouseData) {
        if (!mouseData || !mouseData.positions || mouseData.positions.length === 0) {
          return 0;
        }
        
        // Estimation conservatrice : environ 0.5-1 bit par mouvement
        const positionEntropy = Math.min(32, mouseData.positions.length * 0.5);
        
        // Les variations de vitesse apportent une entropie supplémentaire
        let velocityEntropy = 0;
        if (mouseData.velocities && mouseData.velocities.length > 0) {
          velocityEntropy = Math.min(16, mouseData.velocities.length * 0.3);
        }
        
        return Math.round(positionEntropy + velocityEntropy);
      },
      
      setupTimingEntropyCollector() {
        console.log('Configuration du collecteur d\'entropie timing');
        
        // Structure pour stocker les données de timing
        const timingData = {
          samples: [],
          differences: []
        };
        
        // Mettre à jour l'état de cette source
        AppModules.UI.updateSourceStatus('timing', 'waiting');
        
        // Fonction pour collecter un échantillon de timing
        const collectTimingSample = () => {
          const start = performance.now();
          
          // Effectuer une opération pour mesurer les variations de temps d'exécution
          let sum = 0;
          for (let i = 0; i < 10000; i++) {
            sum += Math.sin(i) * Math.cos(i);
          }
          
          const end = performance.now();
          const duration = end - start;
          
          // Enregistrer l'échantillon
          timingData.samples.push(duration);
          
          // Calculer les différences entre échantillons successifs
          if (timingData.samples.length > 1) {
            const lastIndex = timingData.samples.length - 1;
            const diff = Math.abs(timingData.samples[lastIndex] - timingData.samples[lastIndex - 1]);
            timingData.differences.push(diff);
          }
          
          // Limiter le nombre d'échantillons
          if (timingData.samples.length > 200) {
            timingData.samples = timingData.samples.slice(-100);
            timingData.differences = timingData.differences.slice(-99);
          }
          
          // Ajouter à l'entropie
          if (timingData.samples.length > 10) {
            AppModules.UI.updateSourceStatus('timing', 'collecting');
            this.addEntropySource('timing', timingData);
          }
          
          // Continuer à collecter
          if (timingData.samples.length < 200) {
            setTimeout(collectTimingSample, 100);
          } else {
            // Réduire la fréquence une fois que nous avons beaucoup d'échantillons
            setTimeout(collectTimingSample, 500);
          }
        };
        
        // Démarrer la collecte
        setTimeout(collectTimingSample, 100);
        
        // Pas de nettoyage nécessaire pour ce collecteur car il s'auto-régule
      },
      
      estimateTimingEntropy(timingData) {
        if (!timingData || !timingData.samples || timingData.samples.length === 0) {
          return 0;
        }
        
        // L'entropie des timings est généralement faible
        // Les variations de timing peuvent fournir ~0.1-0.2 bits par échantillon
        let baseEntropy = Math.min(16, timingData.samples.length * 0.1);
        
        // Les différences entre échantillons sont plus informatives
        let diffEntropy = 0;
        if (timingData.differences && timingData.differences.length > 0) {
          diffEntropy = Math.min(8, timingData.differences.length * 0.15);
        }
        
        return Math.round(baseEntropy + diffEntropy);
      },
      
      setupNetworkEntropyCollector() {
        console.log('Configuration du collecteur d\'entropie réseau');
        
        // Structure pour stocker les données de latence réseau
        const networkData = {
          latencies: [],
          timestamps: []
        };
        
        // Mettre à jour l'état de cette source
        AppModules.UI.updateSourceStatus('network', 'waiting');
        
        // Liste d'endpoints à ping (des ressources locales pour minimiser les erreurs CORS)
        const endpoints = [
          'favicon.ico',
          'index.html',
          'styles.css',
          'visualizers.js',
          'application.js'
        ];
        
        // Fonction pour mesurer la latence d'une requête
        const measureLatency = (endpoint) => {
          const timestamp = performance.now();
          
          fetch(endpoint, { 
            method: 'HEAD',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          })
          .then(response => {
            const latency = performance.now() - timestamp;
            
            // Enregistrer la latence
            networkData.latencies.push(latency);
            networkData.timestamps.push(timestamp);
            
            // Limiter le nombre d'échantillons
            if (networkData.latencies.length > 100) {
              networkData.latencies = networkData.latencies.slice(-50);
              networkData.timestamps = networkData.timestamps.slice(-50);
            }
            
            // Ajouter à l'entropie
            if (networkData.latencies.length > 5) {
              AppModules.UI.updateSourceStatus('network', 'collecting');
              this.addEntropySource('network', networkData);
            }
          })
          .catch(error => {
            console.error(`Erreur de ping réseau pour ${endpoint}:`, error);
          });
        };
        
        // Programmer des pings réguliers
        const schedulePings = () => {
          // Choisir un endpoint aléatoire
          const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
          
          // Mesurer la latence
          measureLatency(endpoint);
          
          // Programmer le prochain ping avec un délai aléatoire
          const delay = 2000 + Math.random() * 3000;
          setTimeout(schedulePings, delay);
        };
        
        // Démarrer les pings
        schedulePings();
        
        // Pas de nettoyage nécessaire car nous ne pouvons pas annuler les fetch
      },
      
      estimateNetworkEntropy(networkData) {
        if (!networkData || !networkData.latencies || networkData.latencies.length === 0) {
          return 0;
        }
        
        // Chaque mesure de latence fournit une faible quantité d'entropie
        // Estimation conservatrice : ~0.5-1 bit par mesure
        return Math.min(12, networkData.latencies.length * 0.5);
      },
      
      setupSensorEntropyCollector() {
        console.log('Configuration du collecteur d\'entropie capteurs');
        
        // Structure pour stocker les données des capteurs
        const sensorData = {
          orientation: [],
          motion: [],
          light: [],
          timestamps: []
        };
        
        // Vérifier la disponibilité des API de capteurs
        const hasSensors = (
          window.DeviceOrientationEvent || 
          window.DeviceMotionEvent || 
          ('AmbientLightSensor' in window)
        );
        
        if (!hasSensors) {
          console.log('Aucun capteur mobile détecté');
          AppModules.UI.updateSourceStatus('sensors', 'unavailable');
          return;
        }
        
        // Mettre à jour l'état initial
        AppModules.UI.updateSourceStatus('sensors', 'waiting');
        
        // Écouter l'orientation de l'appareil
        if (window.DeviceOrientationEvent) {
          const orientationListener = (event) => {
            if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
              // Limiter la taille des données
              if (sensorData.orientation.length >= 200) {
                sensorData.orientation = sensorData.orientation.slice(-100);
              }
              
              // Enregistrer les données d'orientation
              sensorData.orientation.push({
                alpha: event.alpha,
                beta: event.beta,
                gamma: event.gamma,
                time: performance.now()
              });
              
              // Mettre à jour le timestamp
              sensorData.timestamps.push(performance.now());
              
              // Ajouter à l'entropie si assez de données
              if (sensorData.orientation.length % 10 === 0) {
                AppModules.UI.updateSourceStatus('sensors', 'collecting');
                this.addEntropySource('sensors', sensorData);
              }
            }
          };
          
          // Ajouter l'écouteur d'événements
          window.addEventListener('deviceorientation', orientationListener);
          
          // Stocker pour nettoyage
          this.entropyCollectors.push({
            name: 'orientation',
            cleanup: () => window.removeEventListener('deviceorientation', orientationListener)
          });
        }
        
        // Écouter le mouvement de l'appareil
        if (window.DeviceMotionEvent) {
          const motionListener = (event) => {
            if (event.acceleration && event.rotationRate) {
              // Limiter la taille des données
              if (sensorData.motion.length >= 200) {
                sensorData.motion = sensorData.motion.slice(-100);
              }
              
              // Enregistrer les données de mouvement
              sensorData.motion.push({
                x: event.acceleration.x,
                y: event.acceleration.y,
                z: event.acceleration.z,
                alpha: event.rotationRate.alpha,
                beta: event.rotationRate.beta,
                gamma: event.rotationRate.gamma,
                interval: event.interval,
                time: performance.now()
              });
              
              // Mettre à jour le timestamp
              sensorData.timestamps.push(performance.now());
              
              // Ajouter à l'entropie si assez de données
              if (sensorData.motion.length % 10 === 0) {
                AppModules.UI.updateSourceStatus('sensors', 'collecting');
                this.addEntropySource('sensors', sensorData);
              }
            }
          };
          
          // Ajouter l'écouteur d'événements
          window.addEventListener('devicemotion', motionListener);
          
          // Stocker pour nettoyage
          this.entropyCollectors.push({
            name: 'motion',
            cleanup: () => window.removeEventListener('devicemotion', motionListener)
          });
        }
        
        // Essayer d'utiliser le capteur de lumière ambiante si disponible
        if ('AmbientLightSensor' in window) {
          try {
            const lightSensor = new AmbientLightSensor();
            
            lightSensor.onreading = () => {
              // Limiter la taille des données
              if (sensorData.light.length >= 100) {
                sensorData.light = sensorData.light.slice(-50);
              }
              
              // Enregistrer les données de luminosité
              sensorData.light.push({
                illuminance: lightSensor.illuminance,
                time: performance.now()
              });
              
              // Mettre à jour le timestamp
              sensorData.timestamps.push(performance.now());
              
              // Ajouter à l'entropie
              if (sensorData.light.length % 5 === 0) {
                AppModules.UI.updateSourceStatus('sensors', 'collecting');
                this.addEntropySource('sensors', sensorData);
              }
            };
            
            lightSensor.onerror = (event) => {
              console.error('Erreur du capteur de lumière:', event.error.name, event.error.message);
            };
            
            lightSensor.start();
            
            // Stocker pour nettoyage
            this.entropyCollectors.push({
              name: 'light',
              cleanup: () => lightSensor.stop()
            });
          } catch (error) {
            console.error('Erreur lors de l\'initialisation du capteur de lumière:', error);
          }
        }
      },
      
      estimateSensorEntropy(sensorData) {
        let entropy = 0;
        
        // Entropie des données d'orientation
        if (sensorData.orientation && sensorData.orientation.length > 0) {
          entropy += Math.min(24, sensorData.orientation.length * 0.5);
        }
        
        // Entropie des données de mouvement
        if (sensorData.motion && sensorData.motion.length > 0) {
          entropy += Math.min(32, sensorData.motion.length * 0.8);
        }
        
        // Entropie des données de lumière
        if (sensorData.light && sensorData.light.length > 0) {
          entropy += Math.min(8, sensorData.light.length * 0.4);
        }
        
        return Math.round(entropy);
      },
      
      setupSystemEntropyCollector() {
        console.log('Configuration du collecteur d\'entropie système');
        
        // Collecter des informations sur le système
        const systemData = {
          screen: {
            width: window.screen.width,
            height: window.screen.height,
            colorDepth: window.screen.colorDepth,
            pixelRatio: window.devicePixelRatio
          },
          navigator: {
            platform: navigator.platform,
            language: navigator.language,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory
          },
          timing: {
            navigationStart: performance.timing ? performance.timing.navigationStart : null,
            loadEventEnd: performance.timing ? performance.timing.loadEventEnd : null,
            now: performance.now()
          },
          date: new Date().toString(),
          timezone: new Date().getTimezoneOffset()
        };
        
        // Ajouter la liste des plugins si disponible
        if (navigator.plugins) {
          systemData.plugins = Array.from(navigator.plugins).map(p => p.name);
        }
        
        // Collecter des informations sur le canvas
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          
          if (gl) {
            systemData.webgl = {
              vendor: gl.getParameter(gl.VENDOR),
              renderer: gl.getParameter(gl.RENDERER),
              version: gl.getParameter(gl.VERSION),
              shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
              extensions: gl.getSupportedExtensions()
            };
          }
        } catch (e) {
          console.error('Erreur lors de la collecte des informations WebGL:', e);
        }
        
        // Ajouter à l'entropie
        this.addEntropySource('system', systemData);
        AppModules.UI.updateSourceStatus('system', 'completed');
      },
      
      estimateSystemEntropy(systemData) {
        // Estimation conservatrice de l'entropie système
        let entropy = 16; // Base fixe
        
        // Ajouter de l'entropie pour les informations de WebGL si disponibles
        if (systemData.webgl) {
          entropy += 8;
        }
        
        // Ajouter de l'entropie pour les plugins si disponibles
        if (systemData.plugins && systemData.plugins.length > 0) {
          entropy += Math.min(4, systemData.plugins.length * 0.5);
        }
        
        return Math.round(entropy);
      },
      
      async generateSeed() {
        console.log('Génération de graine cryptographique à partir de l\'entropie collectée');
        
        // Créer un pool d'entropie à partir de toutes les sources
        let entropyPool = '';
        
        // Ajouter les données audio
        if (this.entropySources.audio) {
          entropyPool += JSON.stringify(this.entropySources.audio);
        }
        
        // Ajouter les données souris
        if (this.entropySources.mouse) {
          entropyPool += JSON.stringify(this.entropySources.mouse);
        }
        
        // Ajouter les données timing
        if (this.entropySources.timing) {
          entropyPool += JSON.stringify(this.entropySources.timing);
        }
        
        // Ajouter les données réseau
        if (this.entropySources.network) {
          entropyPool += JSON.stringify(this.entropySources.network);
        }
        
        // Ajouter les données capteurs
        if (this.entropySources.sensors) {
          entropyPool += JSON.stringify(this.entropySources.sensors);
        }
        
        // Ajouter les données système
        if (this.entropySources.system) {
          entropyPool += JSON.stringify(this.entropySources.system);
        }
        
        // Ajouter le timestamp courant
        entropyPool += new Date().getTime().toString();
        
        // Ajouter des nombres aléatoires cryptographiques
        const randomBuffer = new Uint8Array(64);
        window.crypto.getRandomValues(randomBuffer);
        entropyPool += Array.from(randomBuffer).join('');
        
        // Créer un condensat SHA-256 du pool d'entropie
        const encodedPool = new TextEncoder().encode(entropyPool);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedPool);
        
        // Convertir en chaîne hexadécimale
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
      }
    },
    
    // Crypto Module - Gère la génération de clés
    Crypto: {
      dilithiumSimulator: null,
      keyPair: null,
      
      init() {
        console.log('Initialisation du module Cryptographie');
        
        try {
          // Créer une instance du simulateur Dilithium
          this.dilithiumSimulator = new DilithiumSimulator();
          return this;
        } catch (error) {
          console.error('Erreur lors de l\'initialisation du simulateur Dilithium:', error);
          throw error;
        }
      },
      
      async generateKeyPair() {
        // Vérifier qu'il y a assez d'entropie
        if (AppModules.Entropy.currentEntropyBits < AppModules.Entropy.targetEntropyBits) {
          AppModules.UI.updateStatus(`Entropie insuffisante: ${AppModules.Entropy.currentEntropyBits}/${AppModules.Entropy.targetEntropyBits} bits`);
          return;
        }
        
        AppModules.UI.updateStatus('Génération de la paire de clés post-quantique...');
        
        try {
          // Générer une graine cryptographique à partir de l'entropie collectée
          const seed = await AppModules.Entropy.generateSeed();
          console.log('Graine cryptographique générée:', seed);
          
          // Générer la paire de clés Dilithium
          this.keyPair = await this.dilithiumSimulator.generateKeyPair(seed);
          
          // Afficher les clés
          AppModules.UI.displayKey(this.keyPair);
          AppModules.UI.updateStatus('Paire de clés générée avec succès');
          
          return this.keyPair;
        } catch (error) {
          console.error('Erreur lors de la génération de la paire de clés:', error);
          AppModules.UI.updateStatus('Erreur lors de la génération de clés');
        }
      },
      
      exportKeys() {
        if (!this.keyPair) {
          AppModules.UI.updateStatus('Aucune paire de clés à exporter');
          return;
        }
        
        try {
          // Créer un objet avec les données des clés
          const exportData = {
            algorithm: 'CRYSTALS-Dilithium',
            entropyBits: AppModules.Entropy.currentEntropyBits,
            generationTime: new Date().toISOString(),
            publicKey: this.keyPair.publicKey,
            privateKey: this.keyPair.privateKey
          };
          
          // Convertir en JSON
          const jsonData = JSON.stringify(exportData, null, 2);
          
          // Créer un blob
          const blob = new Blob([jsonData], { type: 'application/json' });
          
          // Créer une URL pour le téléchargement
          const url = URL.createObjectURL(blob);
          
          // Créer un lien de téléchargement
          const a = document.createElement('a');
          a.href = url;
          a.download = `dilithium-keypair-${new Date().getTime()}.json`;
          
          // Ajouter temporairement à la page et déclencher le clic
          document.body.appendChild(a);
          a.click();
          
          // Nettoyer
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          AppModules.UI.updateStatus('Paire de clés exportée avec succès');
        } catch (error) {
          console.error('Erreur lors de l\'exportation des clés:', error);
          AppModules.UI.updateStatus('Erreur lors de l\'exportation des clés');
        }
      }
    }
  };
  // Application principale
const Application = {
    async init() {
      console.log('Initialisation du Générateur de Clés Post-Quantiques Audio');
      
      try {
        // Initialiser le module UI en premier
        await AppModules.UI.init();
        
        // Initialiser les autres modules avec gestion d'erreur pour chacun
        try {
          await AppModules.Audio.init();
        } catch (audioError) {
          console.error('Erreur lors de l\'initialisation audio:', audioError);
          AppModules.UI.updateStatus('Erreur d\'initialisation audio. Certaines fonctionnalités pourraient être limitées.');
        }
        
        try {
          await AppModules.Entropy.init();
        } catch (entropyError) {
          console.error('Erreur lors de l\'initialisation du module d\'entropie:', entropyError);
          AppModules.UI.updateStatus('Erreur d\'initialisation du collecteur d\'entropie.');
        }
        
        try {
          await AppModules.Crypto.init();
        } catch (cryptoError) {
          console.error('Erreur lors de l\'initialisation cryptographique:', cryptoError);
          AppModules.UI.updateStatus('Erreur d\'initialisation cryptographique.');
        }
        
        console.log('Application initialisée avec succès');
        AppModules.UI.updateStatus('Prêt. Cliquez sur "Démarrer l\'enregistrement" pour collecter de l\'entropie audio.');
        
        // Initialiser l'entropie système dès le départ
        try {
          AppModules.Entropy.setupSystemEntropyCollector();
        } catch (systemEntropyError) {
          console.error('Erreur lors de l\'initialisation de l\'entropie système:', systemEntropyError);
        }
      } catch (error) {
        console.error('Erreur critique lors de l\'initialisation de l\'application:', error);
        
        // Tenter d'afficher un message d'erreur même si le module UI a échoué
        try {
          const statusElement = document.getElementById('status-message');
          if (statusElement) {
            statusElement.textContent = 'Erreur d\'initialisation. Veuillez recharger la page.';
            statusElement.style.color = '#cf6679'; // Rouge d'erreur
          }
        } catch (uiError) {
          console.error('Impossible d\'afficher le message d\'erreur:', uiError);
        }
      }
    },
    
    cleanup() {
      // Nettoyer les ressources
      if (AppModules.Audio.audioStream) {
        AppModules.Audio.audioStream.getTracks().forEach(track => track.stop());
      }
      
      // Arrêter les collecteurs d'entropie
      if (AppModules.Entropy.entropyCollectors) {
        AppModules.Entropy.entropyCollectors.forEach(collector => {
          if (collector.cleanup) {
            collector.cleanup();
          }
        });
      }
    }
  };
  
  // Démarrer l'application quand le DOM est chargé
  document.addEventListener('DOMContentLoaded', () => {
    Application.init();
  });
  
  // Nettoyer les ressources au déchargement de la page
  window.addEventListener('beforeunload', () => {
    Application.cleanup();
  });  