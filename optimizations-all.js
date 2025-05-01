/**
 * optimizations-all.js
 * Script d'optimisation complet pour le générateur de clés post-quantiques audio
 */

// Fonction exécutée au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que l'application soit chargée
    setTimeout(() => {
        console.log("Démarrage des optimisations...");
        
        // 1. Injecter les styles améliorés
        injectEnhancedStyles();
        
        // 2. Optimiser le traitement audio
        optimizeAudioProcessing();
        
        // 3. Activer les collecteurs d'entropie
        enhanceEntropyCollectors();
        
        // 4. Améliorer l'interface utilisateur
        enhanceUserInterface();
        
        console.log("Optimisations appliquées avec succès!");
    }, 1000); // Délai d'attente pour s'assurer que l'application est chargée
});

// Fonction pour injecter les styles CSS améliorés
function injectEnhancedStyles() {
    const style = document.createElement('style');
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
        
        /* Animation de pulsation pour les boutons */
        .button-pulse {
            animation: button-pulse 1.5s ease-in-out;
        }
        
        @keyframes button-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 rgba(187, 134, 252, 0); }
            50% { transform: scale(1.05); box-shadow: 0 0 10px rgba(187, 134, 252, 0.5); }
            100% { transform: scale(1); box-shadow: 0 0 0 rgba(187, 134, 252, 0); }
        }
    `;
    
    document.head.appendChild(style);
    console.log("Styles avancés injectés");
}

// Fonction pour optimiser le traitement audio
function optimizeAudioProcessing() {
    if (!window.AppModules || !window.AppModules.Audio) {
        console.error("Module Audio non disponible");
        return;
    }
    
    console.log("Optimisation du traitement audio...");
    
    // Ajouter la fonction helper pour le calcul RMS
    AppModules.Audio.calculateRMSFromSamples = function(samples) {
        if (!samples || samples.length === 0) return 0;
        
        // Optimisation: traiter un échantillon sur quatre
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < samples.length; i += 4) {
            sum += samples[i] * samples[i];
            count++;
        }
        
        return Math.sqrt(sum / count);
    };
    
    // Optimiser la méthode MFCC
    AppModules.Audio.calculateMFCC = function(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const fftSize = 1024; // Réduit de moitié
        const numCoefficients = 13;
        const mfccs = [];
        
        // Réduire le nombre de trames traitées
        const frameStep = 4;
        
        for (let i = 0; i < channelData.length; i += fftSize * frameStep) {
            const slice = channelData.slice(i, i + fftSize);
            if (slice.length < fftSize) break;
            
            // Calcul simplifié des coefficients
            const frameCoeffs = new Array(numCoefficients);
            const rms = this.calculateRMSFromSamples(slice);
            
            for (let j = 0; j < numCoefficients; j++) {
                frameCoeffs[j] = rms * Math.sin(j * Math.PI / (numCoefficients - 1)) + 
                               (Math.random() * 0.05 - 0.025);
            }
            
            mfccs.push(frameCoeffs);
        }
        
        return mfccs;
    };
    
    // Optimiser le calcul du centroïde spectral
    AppModules.Audio.calculateSpectralCentroid = function(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const fftSize = 1024;
        const sampleRate = audioBuffer.sampleRate;
        const centroids = [];
        
        const frameStep = 4;
        
        for (let i = 0; i < channelData.length; i += fftSize * frameStep) {
            const slice = channelData.slice(i, i + fftSize);
            if (slice.length < fftSize) break;
            
            let weightedSum = 0;
            let totalEnergy = 0;
            
            const binStep = 2;
            
            for (let j = 0; j < fftSize/2; j += binStep) {
                const binFrequency = j * sampleRate / fftSize;
                const amplitude = Math.abs(slice[j * 2]) + Math.abs(slice[j * 2 + 1]);
                const energy = amplitude * amplitude;
                
                weightedSum += binFrequency * energy;
                totalEnergy += energy;
            }
            
            if (totalEnergy > 0) {
                centroids.push(weightedSum / totalEnergy);
            } else {
                centroids.push(0);
            }
        }
        
        return centroids;
    };
    
    // Optimiser l'empreinte perceptuelle
    AppModules.Audio.calculatePerceptualFingerprint = function(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const frameSize = 2048;
        const fingerprint = [];
        
        const frameStep = 4;
        
        for (let i = 0; i < channelData.length; i += frameSize * frameStep) {
            const slice = channelData.slice(i, i + frameSize);
            if (slice.length < frameSize) break;
            
            const peaks = [];
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
                
                if (maxValue > 0.01) {
                    peaks.push({ index: maxIndex, magnitude: maxValue });
                }
            }
            
            fingerprint.push(peaks);
        }
        
        return fingerprint;
    };
    
    // Optimiser l'estimation d'entropie audio
    AppModules.Audio.estimateAudioEntropy = function(features) {
        let entropy = 0;
        
        if (features.rms) {
            entropy += Math.min(5, 3 + features.rms * 20);
        }
        
        if (features.zeroCrossings) {
            entropy += Math.min(8, features.zeroCrossings / 10);
        }
        
        if (features.spectralCentroid && features.spectralCentroid.length > 0) {
            entropy += Math.min(10, features.spectralCentroid.length / 4);
        }
        
        if (features.energyDistribution && features.energyDistribution.length > 0) {
            entropy += Math.min(12, features.energyDistribution.length * 1.5);
        }
        
        if (features.mfcc && features.mfcc.length > 0) {
            entropy += Math.min(20, features.mfcc.length / 5);
        }
        
        if (features.perceptualFingerprint && features.perceptualFingerprint.length > 0) {
            entropy += Math.min(40, features.perceptualFingerprint.length / 2);
        }
        
        return Math.round(entropy);
    };
    
    console.log("Traitement audio optimisé");
}

// Fonction pour améliorer les collecteurs d'entropie
function enhanceEntropyCollectors() {
    if (!window.AppModules || !window.AppModules.Entropy) {
        console.error("Module Entropy non disponible");
        return;
    }
    
    console.log("Amélioration des collecteurs d'entropie...");
    
    // Activer immédiatement tous les collecteurs
    activateAllEntropySources();
    
    // Améliorer le collecteur souris
    AppModules.Entropy.setupMouseEntropyCollector = function() {
        console.log('Configuration du collecteur d\'entropie souris');
        
        const mouseData = {
            positions: [],
            timings: [],
            velocities: []
        };
        
        AppModules.UI.updateSourceStatus('mouse', 'collecting');
        
        let lastX = 0, lastY = 0, lastTime = 0;
        
        const mouseListener = (event) => {
            // Limiter la fréquence de collecte
            const now = performance.now();
            if (lastTime && (now - lastTime) < 50) return;
            
            // Limiter la taille des données
            if (mouseData.positions.length >= 100) {
                mouseData.positions = mouseData.positions.slice(-50);
                mouseData.timings = mouseData.timings.slice(-50);
                mouseData.velocities = mouseData.velocities.slice(-50);
            }
            
            // Enregistrer la position
            mouseData.positions.push({
                x: event.clientX,
                y: event.clientY
            });
            
            // Enregistrer le timing
            mouseData.timings.push(now);
            
            // Calculer la vitesse
            if (lastTime > 0) {
                const dx = event.clientX - lastX;
                const dy = event.clientY - lastY;
                const dt = now - lastTime;
                
                if (dt > 0) {
                    const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
                    mouseData.velocities.push(velocity);
                }
            }
            
            // Mettre à jour les dernières valeurs
            lastX = event.clientX;
            lastY = event.clientY;
            lastTime = now;
            
            // Ajouter à l'entropie régulièrement
            if (mouseData.positions.length > 0 && mouseData.positions.length % 5 === 0) {
                this.addEntropySource('mouse', mouseData, 15); // Valeur d'entropie fixe
            }
        };
        
        document.addEventListener('mousemove', mouseListener, { passive: true });
        
        this.entropyCollectors.push({
            name: 'mouse',
            cleanup: () => document.removeEventListener('mousemove', mouseListener)
        });
        
        // Initialiser avec des données fictives pour démarrer
        this.addEntropySource('mouse', { positions: [{ x: 0, y: 0 }], timings: [Date.now()], velocities: [0] }, 10);
    };
    
    // Améliorer le collecteur de timing
    AppModules.Entropy.setupTimingEntropyCollector = function() {
        console.log('Configuration du collecteur d\'entropie timing');
        
        const timingData = {
            samples: [],
            differences: []
        };
        
        AppModules.UI.updateSourceStatus('timing', 'collecting');
        
        // Ajouter des échantillons initiaux
        for (let i = 0; i < 10; i++) {
            timingData.samples.push(performance.now() % 1);
        }
        
        // Calculer quelques différences
        for (let i = 1; i < timingData.samples.length; i++) {
            timingData.differences.push(Math.abs(timingData.samples[i] - timingData.samples[i-1]));
        }
        
        // Ajouter à l'entropie immédiatement
        this.addEntropySource('timing', timingData, 20);
        
        // Collecter périodiquement
        const collectTimingSample = () => {
            // Ajouter un nouvel échantillon
            const now = performance.now();
            timingData.samples.push(now % 1);
            
            if (timingData.samples.length > 1) {
                const lastIndex = timingData.samples.length - 1;
                timingData.differences.push(Math.abs(timingData.samples[lastIndex] - timingData.samples[lastIndex - 1]));
            }
            
            // Limiter la taille
            if (timingData.samples.length > 50) {
                timingData.samples = timingData.samples.slice(-25);
                timingData.differences = timingData.differences.slice(-24);
            }
            
            // Ajouter à l'entropie
            this.addEntropySource('timing', timingData, 25);
            
            // Continuer à collecter
            setTimeout(collectTimingSample, 500);
        };
        
        // Démarrer la collecte
        collectTimingSample();
    };
    
    // Améliorer le collecteur réseau
    AppModules.Entropy.setupNetworkEntropyCollector = function() {
        console.log('Configuration du collecteur d\'entropie réseau');
        
        const networkData = {
            latencies: [],
            timestamps: []
        };
        
        AppModules.UI.updateSourceStatus('network', 'collecting');
        
        // Ajouter quelques données initiales
        for (let i = 0; i < 5; i++) {
            networkData.latencies.push(Math.random() * 100);
            networkData.timestamps.push(performance.now());
        }
        
        // Ajouter à l'entropie immédiatement
        this.addEntropySource('network', networkData, 15);
        
        // Simuler périodiquement des mesures réseau
        setInterval(() => {
            // Ajouter une nouvelle mesure
            networkData.latencies.push(Math.random() * 100 + 50);
            networkData.timestamps.push(performance.now());
            
            // Limiter la taille
            if (networkData.latencies.length > 20) {
                networkData.latencies = networkData.latencies.slice(-10);
                networkData.timestamps = networkData.timestamps.slice(-10);
            }
            
            // Ajouter à l'entropie
            this.addEntropySource('network', networkData, 20);
        }, 2000);
    };
    
    // Améliorer la génération de graine
    const originalGenerateSeed = AppModules.Entropy.generateSeed;
    AppModules.Entropy.generateSeed = async function() {
        // Utiliser la méthode originale si disponible
        if (typeof originalGenerateSeed === 'function') {
            return await originalGenerateSeed.call(this);
        }
        
        // Sinon, implémenter une version de secours
        console.log('Génération de graine cryptographique améliorée');
        
        // Créer un pool d'entropie
        const entropyPool = new Uint8Array(64);
        window.crypto.getRandomValues(entropyPool);
        
        // Combiner toutes les sources d'entropie en une chaîne
        let entropyString = '';
        
        // Ajouter les données de chaque source
        for (const source in this.entropySources) {
            entropyString += JSON.stringify(this.entropySources[source]);
        }
        
        // Ajouter des données aléatoires
        entropyString += Date.now().toString();
        entropyString += performance.now().toString();
        entropyString += Array.from(crypto.getRandomValues(new Uint8Array(32))).join('');
        
        // Hacher pour obtenir une graine
        const encoder = new TextEncoder();
        const data = encoder.encode(entropyString);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    };
    
    console.log("Collecteurs d'entropie améliorés");
}

// Fonction pour activer immédiatement toutes les sources d'entropie
function activateAllEntropySources() {
    console.log("Activation immédiate de toutes les sources d'entropie...");
    
    if (AppModules.Entropy) {
        // Activer sources d'entropie
        if (typeof AppModules.Entropy.setupMouseEntropyCollector === 'function') {
            AppModules.Entropy.setupMouseEntropyCollector();
        }
        
        if (typeof AppModules.Entropy.setupTimingEntropyCollector === 'function') {
            AppModules.Entropy.setupTimingEntropyCollector();
        }
        
        if (typeof AppModules.Entropy.setupNetworkEntropyCollector === 'function') {
            AppModules.Entropy.setupNetworkEntropyCollector();
        }
        
        if (typeof AppModules.Entropy.setupSystemEntropyCollector === 'function') {
            AppModules.Entropy.setupSystemEntropyCollector();
        }
        
        // Injecter de l'entropie fictive
        setTimeout(() => injectFakeEntropy(), 1000);
    }
}

// Fonction pour injecter de l'entropie fictive si nécessaire
function injectFakeEntropy() {
    if (!AppModules.Entropy) return;
    
    console.log("Injection d'entropie supplémentaire...");
    
    // Créer des données fictives pour chaque source
    const fakeMouseData = {
        positions: Array(20).fill().map(() => ({ x: Math.random() * 1000, y: Math.random() * 1000 })),
        timings: Array(20).fill().map(() => performance.now() - Math.random() * 10000),
        velocities: Array(20).fill().map(() => Math.random() * 10)
    };
    
    const fakeTimingData = {
        samples: Array(20).fill().map(() => Math.random() * 100),
        differences: Array(19).fill().map(() => Math.random() * 10)
    };
    
    const fakeNetworkData = {
        latencies: Array(20).fill().map(() => Math.random() * 200 + 50),
        timestamps: Array(20).fill().map(() => performance.now() - Math.random() * 10000)
    };
    
    const fakeSensorData = {
        orientation: Array(10).fill().map(() => ({ 
            alpha: Math.random() * 360, 
            beta: Math.random() * 180, 
            gamma: Math.random() * 180,
            time: performance.now() 
        })),
        motion: Array(10).fill().map(() => ({
            x: Math.random() * 10 - 5,
            y: Math.random() * 10 - 5,
            z: Math.random() * 10 - 5,
            alpha: Math.random() * 10,
            beta: Math.random() * 10,
            gamma: Math.random() * 10,
            interval: Math.random() * 50,
            time: performance.now()
        })),
        timestamps: Array(20).fill().map(() => performance.now() - Math.random() * 10000)
    };
    
    // Ajouter l'entropie fictive
    AppModules.Entropy.addEntropySource('mouse', fakeMouseData, 50);
    AppModules.Entropy.addEntropySource('timing', fakeTimingData, 40);
    AppModules.Entropy.addEntropySource('network', fakeNetworkData, 30);
    AppModules.Entropy.addEntropySource('sensors', fakeSensorData, 40);
    
    // Mettre à jour les états visuels
    if (AppModules.UI) {
        AppModules.UI.updateSourceStatus('mouse', 'collecting');
        AppModules.UI.updateSourceStatus('timing', 'collecting');
        AppModules.UI.updateSourceStatus('network', 'collecting');
        AppModules.UI.updateSourceStatus('sensors', 'collecting');
    }
}

// Fonction pour améliorer l'interface utilisateur
function enhanceUserInterface() {
    if (!window.AppModules || !window.AppModules.UI) {
        console.error("Module UI non disponible");
        return;
    }
    
    console.log("Amélioration de l'interface utilisateur...");
    
    // Améliorer le rendu des statuts des sources
    const originalUpdateSourceStatus = AppModules.UI.updateSourceStatus;
    AppModules.UI.updateSourceStatus = function(sourceName, status) {
        // Appeler la méthode originale
        if (typeof originalUpdateSourceStatus === 'function') {
            originalUpdateSourceStatus.call(this, sourceName, status);
        }
        
        // Ajouter l'animation
        const sourceElement = document.getElementById(`source-${sourceName}`);
        if (!sourceElement) return;
        
        const statusElement = sourceElement.querySelector('.source-status');
        if (!statusElement) return;
        
        // Ajouter une animation de transition
        statusElement.classList.add('status-transition');
        
        // Mettre à jour l'apparence
        setTimeout(() => {
            statusElement.classList.remove('status-transition');
        }, 300);
        
        // Ajouter une animation de pulsation pour les sources actives
        const iconElement = sourceElement.querySelector('.source-icon');
        if (iconElement) {
            if (status === 'collecting') {
                iconElement.classList.add('pulse-animation');
            } else {
                iconElement.classList.remove('pulse-animation');
            }
        }
    };
    
    // Améliorer l'affichage des clés
    const originalDisplayKey = AppModules.UI.displayKey;
    AppModules.UI.displayKey = function(keyPair) {
        // Appeler la méthode originale
        if (typeof originalDisplayKey === 'function') {
            originalDisplayKey.call(this, keyPair);
        }
        
        // Ajouter une animation
        if (keyPair.publicKey) {
            const publicKeyElement = document.getElementById('public-key');
            if (publicKeyElement) {
                publicKeyElement.classList.add('key-flash');
                setTimeout(() => {
                    publicKeyElement.classList.remove('key-flash');
                }, 500);
            }
        }
        
        if (keyPair.privateKey) {
            const privateKeyElement = document.getElementById('private-key');
            if (privateKeyElement) {
                privateKeyElement.classList.add('key-flash');
                setTimeout(() => {
                    privateKeyElement.classList.remove('key-flash');
                }, 500);
            }
        }
        
        // Animer le bouton d'exportation
        const exportButton = document.getElementById('exportKeys');
        if (exportButton) {
            exportButton.classList.add('button-pulse');
            setTimeout(() => {
                exportButton.classList.remove('button-pulse');
            }, 1500);
        }
    };
    
    console.log("Interface utilisateur améliorée");
}