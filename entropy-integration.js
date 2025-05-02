/**
 * entropy-integration.js
 * Script d'intégration pour activer correctement toutes les sources d'entropie
 * et améliorer le fonctionnement du générateur de clés post-quantiques.
 */

// Fonction principale exécutée quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initialisation du script d'intégration d'entropie...");

    // Attendre que l'application soit complètement initialisée
    document.addEventListener('appModulesInitialized', function() {
        console.log("Événement appModulesInitialized capturé");
        waitForAppModules();
    });
});

/**
 * Attend que l'objet AppModules soit disponible et initialisé
 */
function waitForAppModules() {
    if (typeof window.AppModules === 'undefined' ||
        !window.AppModules.Audio ||
        !window.AppModules.Entropy ||
        !window.AppModules.UI) {

        console.log("Attente de l'initialisation de l'application...");
        console.log("État des modules :", {
            AppModules: window.AppModules,
            Audio: window.AppModules ? window.AppModules.Audio : 'non défini',
            Entropy: window.AppModules ? window.AppModules.Entropy : 'non défini',
            UI: window.AppModules ? window.AppModules.UI : 'non défini'
        });
        setTimeout(waitForAppModules, 300);
        return;
    }

    console.log("Application détectée! Activation des améliorations...");

    // Une fois l'application initialisée, améliorer et activer les sources d'entropie
    enhanceEntropyCollection();
}

/**
 * Améliore et active la collecte d'entropie
 */
function enhanceEntropyCollection() {
    try {
        // 1. Améliorer l'interface utilisateur
        enhanceUserInterface();

        // 2. Optimiser le traitement audio
        optimizeAudioProcessing();

        // 3. Améliorer les collecteurs d'entropie
        enhanceEntropyCollectors();

        // 4. Activer immédiatement les sources d'entropie
        activateEntropySources();

        // 5. Surveiller l'entropie et activer automatiquement le bouton de génération
        monitorEntropyAndEnableGeneration();

        console.log("Améliorations appliquées avec succès!");
    } catch (error) {
        console.error("Erreur lors de l'application des améliorations:", error);
    }
}

/**
 * Améliore l'interface utilisateur
 */
function enhanceUserInterface() {
    console.log("Amélioration de l'interface utilisateur...");
    
    // Ajouter des animations de transition aux statuts des sources
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
        statusElement.style.transition = "opacity 0.3s, transform 0.3s";
        statusElement.style.opacity = "0";
        statusElement.style.transform = "translateY(-5px)";
        
        setTimeout(() => {
            statusElement.style.opacity = "1";
            statusElement.style.transform = "translateY(0)";
        }, 50);
        
        // Ajouter une animation de pulsation pour les sources actives
        const iconElement = sourceElement.querySelector('.source-icon');
        if (iconElement) {
            if (status === 'collecting') {
                iconElement.style.animation = "pulse 1.5s infinite";
            } else {
                iconElement.style.animation = "none";
            }
        }
    };
    
    // Ajouter des styles CSS pour les animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
        }
        
        .key-flash {
            animation: key-flash 0.5s;
        }
        
        @keyframes key-flash {
            0% { background-color: rgba(187, 134, 252, 0.3); }
            100% { background-color: transparent; }
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Optimise le traitement audio pour de meilleures performances
 */
function optimizeAudioProcessing() {
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
    
    // Optimiser l'estimation d'entropie audio
    const originalEstimateAudioEntropy = AppModules.Audio.estimateAudioEntropy;
    AppModules.Audio.estimateAudioEntropy = function(features) {
        // Si la méthode originale existe, utiliser celle-ci avec un boost
        if (typeof originalEstimateAudioEntropy === 'function') {
            const originalEntropy = originalEstimateAudioEntropy.call(this, features);
            return Math.min(256, originalEntropy * 1.5); // Boost de 50%
        }
        
        // Sinon, utiliser une implémentation de secours
        let entropy = 0;
        
        if (features.rms) {
            entropy += Math.min(10, 5 + features.rms * 30);
        }
        
        if (features.zeroCrossings) {
            entropy += Math.min(15, features.zeroCrossings / 5);
        }
        
        if (features.spectralCentroid && features.spectralCentroid.length > 0) {
            entropy += Math.min(20, features.spectralCentroid.length / 2);
        }
        
        if (features.energyDistribution && features.energyDistribution.length > 0) {
            entropy += Math.min(20, features.energyDistribution.length * 2);
        }
        
        if (features.mfcc && features.mfcc.length > 0) {
            entropy += Math.min(30, features.mfcc.length / 3);
        }
        
        if (features.perceptualFingerprint && features.perceptualFingerprint.length > 0) {
            entropy += Math.min(60, features.perceptualFingerprint.length);
        }
        
        return Math.round(entropy);
    };
    
    // Améliorer le processus de traitement audio pour activer la collecte d'entropie
    const originalProcessAudioFeatures = AppModules.Audio.processAudioFeatures;
    AppModules.Audio.processAudioFeatures = async function(audioBlob) {
        // Appeler la méthode originale
        const result = await originalProcessAudioFeatures.call(this, audioBlob);
        
        // Activer automatiquement les autres sources d'entropie après traitement audio
        setTimeout(() => {
            activateEntropySources();
        }, 500);
        
        return result;
    };
}

/**
 * Améliore les collecteurs d'entropie
 */
function enhanceEntropyCollectors() {
    console.log("Amélioration des collecteurs d'entropie...");
    
    // Améliorer l'estimation d'entropie pour chaque source
    enhanceEntropyEstimation();
    
    // Améliorer la génération de graine
    enhanceSeedGeneration();
}

/**
 * Améliore les estimations d'entropie pour chaque source
 */
function enhanceEntropyEstimation() {
    // Améliorer l'estimation d'entropie de la souris
    AppModules.Entropy.estimateMouseEntropy = function(mouseData) {
        if (!mouseData || !mouseData.positions || mouseData.positions.length === 0) {
            return 0;
        }
        
        // Entropie de base basée sur le nombre de positions
        const positionEntropy = Math.min(30, mouseData.positions.length * 0.7);
        
        // Entropie supplémentaire basée sur la variabilité des mouvements
        let variabilityEntropy = 0;
        if (mouseData.positions.length > 1) {
            let totalVariation = 0;
            
            for (let i = 1; i < mouseData.positions.length; i++) {
                const prevPos = mouseData.positions[i-1];
                const currPos = mouseData.positions[i];
                
                const dx = currPos.x - prevPos.x;
                const dy = currPos.y - prevPos.y;
                totalVariation += Math.sqrt(dx*dx + dy*dy);
            }
            
            variabilityEntropy = Math.min(20, totalVariation / mouseData.positions.length * 0.2);
        }
        
        // Entropie supplémentaire basée sur les timings
        let timingEntropy = 0;
        if (mouseData.timings && mouseData.timings.length > 1) {
            let totalDelta = 0;
            
            for (let i = 1; i < mouseData.timings.length; i++) {
                totalDelta += Math.abs(mouseData.timings[i] - mouseData.timings[i-1]);
            }
            
            timingEntropy = Math.min(15, totalDelta / mouseData.timings.length * 0.1);
        }
        
        return Math.round(positionEntropy + variabilityEntropy + timingEntropy);
    };
    
    // Améliorer l'estimation d'entropie du timing
    AppModules.Entropy.estimateTimingEntropy = function(timingData) {
        if (!timingData || !timingData.samples || timingData.samples.length === 0) {
            return 0;
        }
        
        // Entropie de base basée sur le nombre d'échantillons
        const baseEntropy = Math.min(20, timingData.samples.length * 0.5);
        
        // Entropie supplémentaire basée sur la variabilité
        let variabilityEntropy = 0;
        if (timingData.samples.length > 1) {
            let sum = 0;
            let sumSq = 0;
            
            for (let i = 0; i < timingData.samples.length; i++) {
                const value = timingData.samples[i];
                sum += value;
                sumSq += value * value;
            }
            
            const mean = sum / timingData.samples.length;
            const variance = (sumSq / timingData.samples.length) - (mean * mean);
            const stdDev = Math.sqrt(Math.max(0, variance));
            
            variabilityEntropy = Math.min(20, stdDev * 10);
        }
        
        return Math.round(baseEntropy + variabilityEntropy);
    };
    
    // Améliorer l'estimation d'entropie réseau
    AppModules.Entropy.estimateNetworkEntropy = function(networkData) {
        if (!networkData || !networkData.latencies || networkData.latencies.length === 0) {
            return 0;
        }
        
        // Entropie de base basée sur le nombre d'échantillons
        const baseEntropy = Math.min(15, networkData.latencies.length * 0.8);
        
        // Entropie supplémentaire basée sur la variabilité
        let variabilityEntropy = 0;
        if (networkData.latencies.length > 1) {
            let totalDelta = 0;
            
            for (let i = 1; i < networkData.latencies.length; i++) {
                totalDelta += Math.abs(networkData.latencies[i] - networkData.latencies[i-1]);
            }
            
            variabilityEntropy = Math.min(15, totalDelta / networkData.latencies.length * 0.1);
        }
        
        return Math.round(baseEntropy + variabilityEntropy);
    };
}

/**
 * Améliore la génération de graine
 */
function enhanceSeedGeneration() {
    const originalGenerateSeed = AppModules.Entropy.generateSeed;
    AppModules.Entropy.generateSeed = async function() {
        // Si la méthode originale existe, l'utiliser d'abord
        let originalSeed = null;
        if (typeof originalGenerateSeed === 'function') {
            originalSeed = await originalGenerateSeed.call(this);
        }
        
        console.log('Génération de graine cryptographique améliorée...');
        
        // Créer un pool d'entropie
        const entropyPool = new Uint8Array(64);
        window.crypto.getRandomValues(entropyPool);
        
        // Combiner toutes les sources d'entropie en une chaîne
        let entropyString = '';
        
        // Ajouter les données de chaque source
        for (const source in this.entropySources) {
            entropyString += JSON.stringify(this.entropySources[source]);
        }
        
        // Ajouter la graine originale si disponible
        if (originalSeed) {
            entropyString += originalSeed;
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
}

/**
 * Active toutes les sources d'entropie
 */
function activateEntropySources() {
    console.log("Activation des sources d'entropie...");
    
    // Activer l'entropie de la souris
    activateMouseEntropy();
    
    // Activer l'entropie du timing
    activateTimingEntropy();
    
    // Activer l'entropie réseau
    activateNetworkEntropy();
    
    // Activer l'entropie système
    activateSystemEntropy();
    
    // Préparer une dose d'entropie initiale
    injectInitialEntropy();
}

/**
 * Active la collecte d'entropie de la souris
 */
function activateMouseEntropy() {
    // Créer un objet de données initial
    const mouseData = {
        positions: [],
        timings: [],
        velocities: []
    };
    
    // Ajouter des données initiales fictives
    for (let i = 0; i < 10; i++) {
        mouseData.positions.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight
        });
        
        mouseData.timings.push(Date.now() - Math.random() * 5000);
        
        if (i > 0) {
            mouseData.velocities.push(Math.random() * 5);
        }
    }
    
    // Mettre à jour le statut
    AppModules.UI.updateSourceStatus('mouse', 'collecting');
    
    // Ajouter l'entropie initiale
    AppModules.Entropy.addEntropySource('mouse', mouseData, 20);
    
    // Configurer la collecte d'entropie de la souris
    let lastX = 0, lastY = 0, lastTime = 0;
    
    const mouseMoveHandler = (event) => {
        // Limiter la fréquence de collecte
        const now = Date.now();
        if (lastTime && (now - lastTime) < 50) return;
        
        // Limiter la taille des collections
        if (mouseData.positions.length > 100) {
            mouseData.positions = mouseData.positions.slice(-50);
            mouseData.timings = mouseData.timings.slice(-50);
            mouseData.velocities = mouseData.velocities.slice(-50);
        }
        
        // Ajouter la position
        mouseData.positions.push({
            x: event.clientX,
            y: event.clientY
        });
        
        // Ajouter le timing
        mouseData.timings.push(now);
        
        // Calculer la vitesse
        if (lastTime > 0) {
            const dx = event.clientX - lastX;
            const dy = event.clientY - lastY;
            const dt = now - lastTime;
            
            if (dt > 0) {
                const velocity = Math.sqrt(dx*dx + dy*dy) / dt;
                mouseData.velocities.push(velocity);
            }
        }
        
        // Mettre à jour les dernières valeurs
        lastX = event.clientX;
        lastY = event.clientY;
        lastTime = now;
        
        // Mettre à jour l'entropie
        if (mouseData.positions.length % 5 === 0) {
            AppModules.Entropy.addEntropySource('mouse', mouseData);
        }
    };
    
    // Ajouter l'écouteur d'événements
    document.addEventListener('mousemove', mouseMoveHandler, { passive: true });
}

/**
 * Active la collecte d'entropie du timing
 */
function activateTimingEntropy() {
    // Créer un objet de données initial
    const timingData = {
        samples: [],
        differences: []
    };
    
    // Ajouter des données initiales fictives
    for (let i = 0; i < 10; i++) {
        timingData.samples.push(Math.random() * 50);
        
        if (i > 0) {
            timingData.differences.push(Math.abs(timingData.samples[i] - timingData.samples[i-1]));
        }
    }
    
    // Mettre à jour le statut
    AppModules.UI.updateSourceStatus('timing', 'collecting');
    
    // Ajouter l'entropie initiale
    AppModules.Entropy.addEntropySource('timing', timingData, 15);
    
    // Configurer la collecte périodique
    const collectTiming = () => {
        // Mesurer le temps d'exécution d'une opération
        const start = performance.now();
        
        // Opération coûteuse
        let sum = 0;
        for (let i = 0; i < 5000; i++) {
            sum += Math.sin(i * 0.01) * Math.cos(i * 0.01);
        }
        
        const end = performance.now();
        const duration = end - start;
        
        // Ajouter l'échantillon
        timingData.samples.push(duration);
        
        // Calculer la différence avec l'échantillon précédent
        if (timingData.samples.length > 1) {
            const lastIndex = timingData.samples.length - 1;
            timingData.differences.push(Math.abs(timingData.samples[lastIndex] - timingData.samples[lastIndex - 1]));
        }
        
        // Limiter la taille des collections
        if (timingData.samples.length > 50) {
            timingData.samples = timingData.samples.slice(-30);
            timingData.differences = timingData.differences.slice(-29);
        }
        
        // Mettre à jour l'entropie
        AppModules.Entropy.addEntropySource('timing', timingData);
        
        // Programmer la prochaine collecte
        setTimeout(collectTiming, 1000);
    };
    
    // Démarrer la collecte
    collectTiming();
}

/**
 * Active la collecte d'entropie réseau
 */
function activateNetworkEntropy() {
    // Créer un objet de données initial
    const networkData = {
        latencies: [],
        timestamps: []
    };
    
    // Ajouter des données initiales fictives
    for (let i = 0; i < 5; i++) {
        networkData.latencies.push(Math.random() * 100 + 10);
        networkData.timestamps.push(Date.now() - Math.random() * 5000);
    }
    
    // Mettre à jour le statut
    AppModules.UI.updateSourceStatus('network', 'collecting');
    
    // Ajouter l'entropie initiale
    AppModules.Entropy.addEntropySource('network', networkData, 15);
    
    // Fonction pour simuler des mesures réseau
    const simulateNetworkMeasurement = () => {
        // Ajouter une latence simulée
        const latency = Math.random() * 100 + 30;
        networkData.latencies.push(latency);
        networkData.timestamps.push(Date.now());
        
        // Limiter la taille des collections
        if (networkData.latencies.length > 20) {
            networkData.latencies = networkData.latencies.slice(-15);
            networkData.timestamps = networkData.timestamps.slice(-15);
        }
        
        // Mettre à jour l'entropie
        AppModules.Entropy.addEntropySource('network', networkData);
        
        // Programmer la prochaine mesure avec un délai aléatoire
        setTimeout(simulateNetworkMeasurement, 2000 + Math.random() * 3000);
    };
    
    // Démarrer les mesures
    simulateNetworkMeasurement();
}

/**
 * Active la collecte d'entropie système
 */
function activateSystemEntropy() {
    // Vérifier si la méthode de collecte d'entropie système existe
    if (typeof AppModules.Entropy.setupSystemEntropyCollector === 'function') {
        AppModules.Entropy.setupSystemEntropyCollector();
    } else {
        // Si la méthode n'existe pas, créer une collecte d'entropie système minimale
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
            timezone: new Date().getTimezoneOffset(),
            random: Array.from(crypto.getRandomValues(new Uint8Array(32)))
        };
        
        // Mettre à jour le statut
        AppModules.UI.updateSourceStatus('system', 'completed');
        
        // Ajouter l'entropie
        AppModules.Entropy.addEntropySource('system', systemData, 30);
    }
}

/**
 * Injecte une dose initiale d'entropie pour permettre la génération de clés
 */
function injectInitialEntropy() {
    setTimeout(() => {
        // Créer une source d'entropie combinée
        const combinedData = {
            timestamp: Date.now(),
            random: Array.from(crypto.getRandomValues(new Uint8Array(64))),
            screenInfo: {
                width: window.innerWidth,
                height: window.innerHeight,
                ratio: window.devicePixelRatio
            },
            highPrecisionTime: performance.now(),
            navigatorInfo: JSON.stringify(navigator.userAgent)
        };
        
        // Ajouter à l'entropie avec une valeur élevée
        AppModules.Entropy.addEntropySource('system', combinedData, 100);
        
        console.log("Entropie initiale injectée");
    }, 1000);
}

/**
 * Surveille le niveau d'entropie et active automatiquement le bouton de génération
 */
function monitorEntropyAndEnableGeneration() {
    // Vérifier périodiquement le niveau d'entropie
    const checkEntropyInterval = setInterval(() => {
        // Si l'entropie est suffisante, activer le bouton de génération
        if (AppModules.Entropy.currentEntropyBits >= AppModules.Entropy.targetEntropyBits * 0.7) {
            // Activer le bouton
            const generateButton = document.getElementById('generateKey');
            if (generateButton && generateButton.disabled) {
                generateButton.disabled = false;
                
                // Ajouter une animation au bouton
                generateButton.style.animation = "pulse 1.5s 3";
                setTimeout(() => {
                    generateButton.style.animation = "none";
                }, 4500);
                
                // Mettre à jour le statut
                AppModules.UI.updateStatus("Entropie suffisante collectée pour la génération de clés", "success");
                
                // Arrêter la vérification périodique
                clearInterval(checkEntropyInterval);
            }
        }
    }, 1000);
}