// enhanced-ui.js - Améliorations de l'interface utilisateur

// Classe pour améliorer le visualiseur d'entropie
class ImprovedEntropyMeter {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with ID "${canvasId}" not found`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Paramètres du compteur d'entropie
        this.targetEntropy = 256; // Bits d'entropie cible
        this.currentEntropy = 0;
        this.segments = 24; // Plus de segments pour une visualisation plus fluide
        this.animationSpeed = 0.8; // Vitesse d'animation
        this.animatedValue = 0;
        
        // Palette de couleurs améliorée
        this.colors = {
            low: { r: 207, g: 102, b: 121 },     // Rouge (#cf6679)
            medium: { r: 255, g: 171, b: 64 },   // Orange (#ffab40)
            high: { r: 3, g: 218, b: 198 },      // Turquoise (#03dac6)
            max: { r: 187, g: 134, b: 252 }      // Violet (#bb86fc)
        };
        
        // S'assurer que le canvas est responsive
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Dessiner le compteur initial
        this.update(0);
    }
    
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width !== this.width) {
            this.canvas.width = rect.width;
            this.width = rect.width;
            this.redraw();
        }
    }
    
    clear() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    update(entropyBits) {
        if (!this.ctx) return;
        
        this.currentEntropy = entropyBits;
        this.animateToValue(entropyBits);
    }
    
    animateToValue(targetValue) {
        // Animation fluide vers la valeur cible
        const animate = () => {
            if (Math.abs(this.animatedValue - targetValue) < 0.1) {
                this.animatedValue = targetValue;
                this.redraw();
                return;
            }
            
            this.animatedValue += (targetValue - this.animatedValue) * this.animationSpeed;
            this.redraw();
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    redraw() {
        this.clear();
        
        // Calculer le pourcentage d'entropie atteint
        const entropyPercentage = Math.min(1, this.animatedValue / this.targetEntropy);
        
        // Dessiner la barre de progression
        this.drawEntropyBar(entropyPercentage);
        
        // Dessiner les segments
        this.drawSegments(entropyPercentage);
        
        // Dessiner le texte d'entropie
        this.drawEntropyText(entropyPercentage);
    }
    
    drawEntropyBar(percentage) {
        if (!this.ctx) return;
        
        // Dessiner une barre de progression avec gradient
        const barHeight = this.height * 0.25;
        const barY = (this.height - barHeight) / 2;
        
        // Dessiner le fond de la barre
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.roundRect(0, barY, this.width, barHeight, barHeight / 2, true);
        
        // Créer un gradient pour la barre de progression
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, 0);
        gradient.addColorStop(0, this.getColorForPercentage(0));
        gradient.addColorStop(0.3, this.getColorForPercentage(0.3));
        gradient.addColorStop(0.6, this.getColorForPercentage(0.6));
        gradient.addColorStop(1, this.getColorForPercentage(1));
        
        // Dessiner la barre de progression
        this.ctx.fillStyle = gradient;
        this.roundRect(0, barY, this.width * percentage, barHeight, barHeight / 2, true);
        
        // Ajouter un effet de lueur
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.getColorForPercentage(percentage);
        this.roundRect(0, barY, this.width * percentage, barHeight, barHeight / 2, true);
        this.ctx.shadowBlur = 0;
    }
    
    drawSegments(percentage) {
        if (!this.ctx) return;
        
        // Calculer le nombre de segments complets
        const completeSegments = Math.floor(percentage * this.segments);
        
        // Calculer le pourcentage du segment partiel
        const partialSegment = (percentage * this.segments) - completeSegments;
        
        // La largeur totale de tous les segments
        const totalWidth = this.width * 0.85;
        const segmentWidth = totalWidth / this.segments;
        const segmentSpacing = segmentWidth * 0.15;
        const segmentActualWidth = segmentWidth - segmentSpacing;
        
        // Position de départ
        const startX = (this.width - totalWidth) / 2;
        
        // Hauteur du segment
        const segmentHeight = this.height * 0.15;
        const segmentY = this.height * 0.75;
        
        // Dessiner les segments
        for (let i = 0; i < this.segments; i++) {
            const x = startX + i * segmentWidth;
            const segmentPercentage = (i + 1) / this.segments;
            
            // Déterminer la couleur et l'opacité du segment
            const color = this.getColorForPercentage(segmentPercentage);
            let opacity = 0.15; // Segments inactifs
            
            if (i < completeSegments) {
                opacity = 0.8; // Segments complets
            } else if (i === completeSegments) {
                opacity = 0.15 + (0.65 * partialSegment); // Segment partiel
            }
            
            this.ctx.fillStyle = this.hexToRgba(color, opacity);
            this.roundRect(x, segmentY, segmentActualWidth, segmentHeight, 3, true);
            
            // Ajouter un effet de lueur pour les segments actifs
            if (opacity > 0.15) {
                this.ctx.shadowBlur = 5;
                this.ctx.shadowColor = color;
                this.roundRect(x, segmentY, segmentActualWidth, segmentHeight, 3, true);
                this.ctx.shadowBlur = 0;
            }
        }
    }
    
    drawEntropyText(percentage) {
        if (!this.ctx) return;
        
        const status = this.getEntropyStatus(percentage);
        const entropyValue = Math.round(this.animatedValue);
        
        // Police et style
        this.ctx.font = 'bold 14px "Roboto", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.getColorForPercentage(percentage);
        
        // Afficher le texte en bits
        this.ctx.fillText(`${entropyValue} / ${this.targetEntropy} bits`, this.width / 2, this.height * 0.4);
        
        // Afficher le statut
        this.ctx.font = '12px "Roboto", sans-serif';
        this.ctx.fillText(status, this.width / 2, this.height * 0.6);
    }
    
    getEntropyStatus(percentage) {
        if (percentage < 0.25) {
            return 'Entropie faible';
        } else if (percentage < 0.5) {
            return 'Entropie moyenne';
        } else if (percentage < 0.75) {
            return 'Entropie élevée';
        } else if (percentage < 0.95) {
            return 'Entropie très élevée';
        } else {
            return 'Entropie maximale';
        }
    }
    
    getColorForPercentage(percentage) {
        let color;
        
        if (percentage < 0.25) {
            color = this.interpolateColor(this.colors.low, this.colors.medium, percentage / 0.25);
        } else if (percentage < 0.5) {
            color = this.interpolateColor(this.colors.medium, this.colors.high, (percentage - 0.25) / 0.25);
        } else if (percentage < 0.75) {
            color = this.interpolateColor(this.colors.high, this.colors.max, (percentage - 0.5) / 0.25);
        } else {
            color = this.colors.max;
        }
        
        return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
    }
    
    interpolateColor(color1, color2, factor) {
        return {
            r: color1.r + (color2.r - color1.r) * factor,
            g: color1.g + (color2.g - color1.g) * factor,
            b: color1.b + (color2.b - color1.b) * factor
        };
    }
    
    roundRect(x, y, width, height, radius, fill = false, stroke = false) {
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
        
        if (fill) {
            this.ctx.fill();
        }
        
        if (stroke) {
            this.ctx.stroke();
        }
    }
    
    hexToRgba(color, opacity) {
        return `${color.replace('rgb', 'rgba').replace(')', `, ${opacity})}`)}`;
    }
}

// Fonctions d'amélioration de l'interface
function updateSourceStatusWithAnimation(sourceName, status) {
    const sourceElement = document.getElementById(`source-${sourceName}`);
    if (!sourceElement) return;
    
    const statusElement = sourceElement.querySelector('.source-status');
    if (!statusElement) return;
    
    // Supprimer les classes de statut existantes
    statusElement.classList.remove('active', 'collecting', 'waiting', 'completed', 'unavailable');
    
    // Ajouter une classe pour l'animation de transition
    statusElement.classList.add('status-transition');
    
    // Mettre à jour le texte et la classe après un court délai pour l'animation
    setTimeout(() => {
        // Mettre à jour le texte
        switch (status) {
            case 'active':
                statusElement.textContent = 'Actif';
                break;
            case 'collecting':
                statusElement.textContent = 'Collecte en cours';
                break;
            case 'completed':
                statusElement.textContent = 'Collecté';
                break;
            case 'waiting':
                statusElement.textContent = 'En attente';
                break;
            case 'unavailable':
                statusElement.textContent = 'Non disponible';
                break;
        }
        
        // Ajouter la classe de statut
        statusElement.classList.add(status);
        
        // Retirer la classe de transition
        setTimeout(() => {
            statusElement.classList.remove('status-transition');
        }, 300);
    }, 150);
    
    // Mettre à jour l'icône de la source si nécessaire
    const iconElement = sourceElement.querySelector('.source-icon');
    if (iconElement) {
        // Ajouter une animation de pulse pour les sources actives
        if (status === 'collecting') {
            iconElement.classList.add('pulse-animation');
        } else {
            iconElement.classList.remove('pulse-animation');
        }
    }
}

function updateStatusWithAnimation(message, type = 'info') {
    const statusContainer = document.querySelector('.status-container');
    const statusElement = document.getElementById('status-message');
    
    if (!statusContainer || !statusElement) return;
    
    // Ajouter une classe pour l'animation de fondu
    statusElement.classList.add('status-fade');
    
    // Supprimer les classes existantes
    statusContainer.classList.remove('error', 'warning', 'success');
    
    // Ajouter la classe appropriée
    if (type !== 'info') {
        statusContainer.classList.add(type);
    }
    
    // Mettre à jour le message après un court délai pour l'animation
    setTimeout(() => {
        statusElement.textContent = message;
        statusElement.classList.remove('status-fade');
    }, 200);
}

function displayKeyWithAnimation(keyPair) {
    // Fonction pour animer l'affichage de la clé caractère par caractère
    const animateKeyDisplay = (element, keyString, speed = 10) => {
        if (!element) return;
        
        element.textContent = '';
        let index = 0;
        
        // Diviser la clé en plusieurs lignes pour une meilleure lisibilité
        const formattedKey = [];
        for (let i = 0; i < keyString.length; i += 64) {
            formattedKey.push(keyString.substr(i, 64));
        }
        
        const keyText = formattedKey.join('\n');
        
        // Animation de l'affichage de la clé
        const timer = setInterval(() => {
            if (index < keyText.length) {
                element.textContent += keyText[index];
                index++;
            } else {
                clearInterval(timer);
                // Animer un flash de succès
                element.classList.add('key-flash');
                setTimeout(() => {
                    element.classList.remove('key-flash');
                }, 500);
            }
        }, speed);
    };
    
    // Animer l'affichage des clés
    if (keyPair.publicKey) {
        const publicKeyElement = document.getElementById('public-key');
        if (publicKeyElement) {
            publicKeyElement.classList.add('key-loading');
            setTimeout(() => {
                publicKeyElement.classList.remove('key-loading');
                animateKeyDisplay(publicKeyElement, keyPair.publicKey, 5);
            }, 500);
        }
    }
    
    if (keyPair.privateKey) {
        const privateKeyElement = document.getElementById('private-key');
        if (privateKeyElement) {
            privateKeyElement.classList.add('key-loading');
            setTimeout(() => {
                privateKeyElement.classList.remove('key-loading');
                animateKeyDisplay(privateKeyElement, keyPair.privateKey, 5);
            }, 800); // Délai légèrement plus long pour la clé privée
        }
    }
    
    // Activer les boutons avec un délai
    setTimeout(() => {
        const exportButton = document.getElementById('exportKeys');
        if (exportButton) {
            exportButton.disabled = false;
            exportButton.classList.add('button-pulse');
            setTimeout(() => {
                exportButton.classList.remove('button-pulse');
            }, 2000);
        }
    }, 1500);
}

function showKeyGenerationProgress() {
    // Élément de progression
    const keyGenContainer = document.getElementById('key-generation');
    if (!keyGenContainer) return;
    
    // Créer un overlay de progression si n'existe pas déjà
    let progressOverlay = document.getElementById('key-gen-overlay');
    
    if (!progressOverlay) {
        progressOverlay = document.createElement('div');
        progressOverlay.id = 'key-gen-overlay';
        progressOverlay.className = 'progress-overlay';
        
        // Spinner
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        for (let i = 0; i < 12; i++) {
            const dot = document.createElement('div');
            dot.className = 'spinner-dot';
            spinner.appendChild(dot);
        }
        
        // Message
        const message = document.createElement('div');
        message.className = 'progress-message';
        message.id = 'key-gen-message';
        message.textContent = 'Génération de la paire de clés post-quantique...';
        
        progressOverlay.appendChild(spinner);
        progressOverlay.appendChild(message);
        keyGenContainer.appendChild(progressOverlay);
    }
    
    // Animer l'apparition
    progressOverlay.style.opacity = '0';
    progressOverlay.style.display = 'flex';
    
    setTimeout(() => {
        progressOverlay.style.opacity = '1';
    }, 50);
    
    return progressOverlay;
}

function updateKeyGenerationProgress(message) {
    const progressMessage = document.getElementById('key-gen-message');
    if (progressMessage) {
        progressMessage.textContent = message;
    }
}

function hideKeyGenerationProgress() {
    const progressOverlay = document.getElementById('key-gen-overlay');
    if (!progressOverlay) return;
    
    // Animer la disparition
    progressOverlay.style.opacity = '0';
    
    setTimeout(() => {
        progressOverlay.style.display = 'none';
    }, 500);
}

function createEntropyAnimation() {
    // Créer un conteneur pour les particules d'entropie
    const entropyContainer = document.querySelector('.entropy-meter-container');
    if (!entropyContainer) return;
    
    // Vérifier si l'animation existe déjà
    let particleContainer = document.getElementById('entropy-particles');
    
    if (!particleContainer) {
        particleContainer = document.createElement('div');
        particleContainer.id = 'entropy-particles';
        particleContainer.className = 'particle-container';
        entropyContainer.appendChild(particleContainer);
    } else {
        // Nettoyer les particules existantes
        particleContainer.innerHTML = '';
    }
    
    // Créer des particules
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'entropy-particle';
        
        // Position et taille aléatoires
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.width = `${3 + Math.random() * 4}px`;
        particle.style.height = particle.style.width;
        
        // Couleur aléatoire
        const hue = Math.floor(Math.random() * 360);
        particle.style.backgroundColor = `hsl(${hue}, 100%, 70%)`;
        
        // Animation
        particle.style.animationDuration = `${2 + Math.random() * 3}s`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        
        particleContainer.appendChild(particle);
    }
    
    return particleContainer;
}

function updateEntropyAnimation(active) {
    const particleContainer = document.getElementById('entropy-particles');
    if (!particleContainer) return;
    
    if (active) {
        particleContainer.classList.add('collecting');
    } else {
        particleContainer.classList.remove('collecting');
    }
}

// Injecter les styles CSS pour les améliorations
function injectEnhancedStyles() {
    const styleId = 'enhanced-ui-styles';
    
    // Éviter d'ajouter les styles plusieurs fois
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Animations pour les transitions de statut */
        .status-transition {
            opacity: 0;
            transform: translateY(-5px);
            transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
        }
        
        .status-fade {
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
        }
        
        /* Animation de pulsation pour les icônes actives */
        .pulse-animation {
            animation: pulse-effect 1.5s infinite;
        }
        
        @keyframes pulse-effect {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
        }
        
        /* Styles pour l'affichage des clés */
        .key-loading {
            background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2), rgba(255,255,255,0.1));
            background-size: 200% 100%;
            animation: loading-gradient 2s infinite;
        }
        
        @keyframes loading-gradient {
            0% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .key-flash {
            animation: key-flash-effect 0.5s;
        }
        
        @keyframes key-flash-effect {
            0% { background-color: rgba(187, 134, 252, 0.3); }
            100% { background-color: transparent; }
        }
        
        /* Overlay de progression pour la génération de clé */
        .progress-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(30, 30, 30, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 100;
            border-radius: var(--border-radius);
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        .progress-message {
            margin-top: 20px;
            font-size: 16px;
            color: var(--text-on-dark-medium);
        }
        
        /* Spinner */
        .spinner {
            display: inline-block;
            position: relative;
            width: 64px;
            height: 64px;
        }
        
        .spinner-dot {
            position: absolute;
            width: 5px;
            height: 5px;
            background-color: var(--primary-color-light);
            border-radius: 50%;
            animation: spinner-animation 1.2s linear infinite;
        }
        
        @keyframes spinner-animation {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
        }
        
        .spinner-dot:nth-child(1) {
            top: 30px; left: 0;
            animation-delay: 0s;
        }
        .spinner-dot:nth-child(2) {
            top: 18px; left: 6px;
            animation-delay: -0.1s;
        }
        .spinner-dot:nth-child(3) {
            top: 6px; left: 18px;
            animation-delay: -0.2s;
        }
        .spinner-dot:nth-child(4) {
            top: 0; left: 30px;
            animation-delay: -0.3s;
        }
        .spinner-dot:nth-child(5) {
            top: 6px; right: 18px;
            animation-delay: -0.4s;
        }
        .spinner-dot:nth-child(6) {
            top: 18px; right: 6px;
            animation-delay: -0.5s;
        }
        .spinner-dot:nth-child(7) {
            top: 30px; right: 0;
            animation-delay: -0.6s;
        }
        .spinner-dot:nth-child(8) {
            bottom: 18px; right: 6px;
            animation-delay: -0.7s;
        }
        .spinner-dot:nth-child(9) {
            bottom: 6px; right: 18px;
            animation-delay: -0.8s;
        }
        .spinner-dot:nth-child(10) {
            bottom: 0; left: 30px;
            animation-delay: -0.9s;
        }
        .spinner-dot:nth-child(11) {
            bottom: 6px; left: 18px;
            animation-delay: -1.0s;
        }
        .spinner-dot:nth-child(12) {
            bottom: 18px; left: 6px;
            animation-delay: -1.1s;
        }
        
        /* Animation de pulsation pour les boutons */
        .button-pulse {
            animation: button-pulse 1.5s ease-in-out;
        }
        
        @keyframes button-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 rgba(187, 134, 252, 0); }
            50% { transform: scale(1.05); box-shadow: 0 0 10px rgba(187, 134, 252, 0.5); }
            100% { transform: scale(1); box-shadow: 0 0 0 rgba(187, 134, 252, 0); }
        }
        
        /* Particules d'entropie */
        .particle-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 5;
        }
        
        .entropy-particle {
            position: absolute;
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        .particle-container.collecting .entropy-particle {
            opacity: 0.7;
            animation: float-particle 3s ease-in-out infinite;
        }
        
        @keyframes float-particle {
            0% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(180deg); }
            100% { transform: translateY(0) rotate(360deg); }
        }
    `;
    
    document.head.appendChild(style);
}

// Fonction d'initialisation des améliorations UI
function initEnhancedUI() {
    console.log('Initialisation de l\'UI améliorée');
    
    // Injecter les styles améliorés
    injectEnhancedStyles();
    
    // Remplacer le visualiseur d'entropie
    const entropyCanvas = document.getElementById('entropy-visualizer');
    if (entropyCanvas) {
        window.entropyMeter = new ImprovedEntropyMeter('entropy-visualizer');
    } else {
        // Créer un canvas si nécessaire
        const entropyContainer = document.querySelector('.entropy-meter-container');
        if (entropyContainer) {
            const canvas = document.createElement('canvas');
            canvas.id = 'entropy-visualizer';
            canvas.width = 300;
            canvas.height = 60;
            entropyContainer.appendChild(canvas);
            
            window.entropyMeter = new ImprovedEntropyMeter('entropy-visualizer');
        }
    }
    
    // Créer l'animation des particules d'entropie
    createEntropyAnimation();
    
    // Remplacer les méthodes d'interface utilisateur
    if (window.AppModules && window.AppModules.UI) {
        // Sauvegarder les méthodes originales
        const originalUpdateStatus = AppModules.UI.updateStatus;
        const originalUpdateSourceStatus = AppModules.UI.updateSourceStatus;
        const originalDisplayKey = AppModules.UI.displayKey;
        const originalUpdateEntropyDisplay = AppModules.UI.updateEntropyDisplay;
        
        // Remplacer par les versions améliorées
        AppModules.UI.updateStatus = function(message, type) {
            // Appeler la méthode originale
            if (originalUpdateStatus) originalUpdateStatus.call(AppModules.UI, message);
            
            // Ajouter l'animation
            updateStatusWithAnimation(message, type || 'info');
        };
        
        AppModules.UI.updateSourceStatus = function(sourceName, status) {
            // Appeler la méthode originale
            if (originalUpdateSourceStatus) originalUpdateSourceStatus.call(AppModules.UI, sourceName, status);
            
            // Ajouter l'animation
            updateSourceStatusWithAnimation(sourceName, status);
            
            // Activer les particules d'entropie si des sources sont en collecte
            const isCollecting = status === 'collecting';
            updateEntropyAnimation(isCollecting);
        };
        
        AppModules.UI.displayKey = function(keyPair) {
            // Cacher la progression
            hideKeyGenerationProgress();
            
            // Appeler la méthode originale
            if (originalDisplayKey) originalDisplayKey.call(AppModules.UI, keyPair);
            
            // Ajouter l'animation
            displayKeyWithAnimation(keyPair);
        };
        
        // Améliorer l'affichage de l'entropie
        AppModules.UI.updateEntropyDisplay = function(entropyBits) {
            // Appeler la méthode originale
            if (originalUpdateEntropyDisplay) originalUpdateEntropyDisplay.call(AppModules.UI, entropyBits);
            
            // Mettre à jour le visualiseur amélioré
            if (window.entropyMeter) {
                window.entropyMeter.update(entropyBits);
            }
        };
        
        // Intercepter la génération de clé pour afficher la progression
        if (AppModules.Crypto) {
            const originalGenerateKeyPair = AppModules.Crypto.generateKeyPair;
            
            AppModules.Crypto.generateKeyPair = async function() {
                // Afficher la progression
                showKeyGenerationProgress();
                updateKeyGenerationProgress('Initialisation de la génération de clé...');
                
                try {
                    // Simuler des étapes de progression
                    setTimeout(() => {
                        updateKeyGenerationProgress('Traitement de l\'entropie collectée...');
                    }, 500);
                    
                    setTimeout(() => {
                        updateKeyGenerationProgress('Génération de la paire de clés post-quantique...');
                    }, 1500);
                    
                    // Appeler la méthode originale
                    const result = await originalGenerateKeyPair.call(AppModules.Crypto);
                    
                    setTimeout(() => {
                        updateKeyGenerationProgress('Finalisation de la génération de clé...');
                    }, 2500);
                    
                    return result;
                } catch (error) {
                    hideKeyGenerationProgress();
                    throw error;
                }
            };
        }
    }
    
    console.log('UI améliorée initialisée avec succès');
}

// Exécuter l'initialisation de l'UI améliorée quand le document est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Attendre un moment pour s'assurer que AppModules est chargé
    setTimeout(initEnhancedUI, 800);
});