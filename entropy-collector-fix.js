/**
 * Corrections et améliorations des collecteurs d'entropie
 * Pour remplacer les méthodes correspondantes dans le module Entropy
 */

// Fonction d'initialisation qui sera appelée pour appliquer les améliorations
function enhanceEntropyCollectors() {
    if (!window.AppModules || !window.AppModules.Entropy) {
        console.error("Module Entropy non disponible");
        return;
    }
    
    console.log("Application des améliorations aux collecteurs d'entropie");
    
    // Correction 1: Amélioration du collecteur d'entropie souris
    AppModules.Entropy.setupMouseEntropyCollector = function() {
        console.log('Configuration du collecteur d\'entropie souris');
        
        // Initialiser la structure de données pour les mouvements souris
        const mouseData = {
            positions: [], // Positions (x, y)
            timings: [],   // Timings des mouvements
            velocities: [] // Vitesses de mouvement
        };
        
        // Mettre à jour l'état de cette source d'entropie
        AppModules.UI.updateSourceStatus('mouse', 'waiting');
        
        // Variables pour le calcul de vitesse
        let lastX = 0, lastY = 0, lastTime = 0;
        let isCollecting = false;
        
        const mouseListener = (event) => {
            // Activer la collecte au premier mouvement
            if (!isCollecting) {
                isCollecting = true;
                AppModules.UI.updateSourceStatus('mouse', 'collecting');
            }
            
            // Limiter la fréquence de collecte pour réduire l'impact sur les performances
            // Collecter un échantillon tous les 50ms au maximum
            const now = performance.now();
            if (lastTime && (now - lastTime) < 50) {
                return;
            }
            
            // Limiter la taille des données collectées
            if (mouseData.positions.length >= 200) {
                // Conserver seulement les 100 derniers mouvements
                mouseData.positions = mouseData.positions.slice(-100);
                mouseData.timings = mouseData.timings.slice(-100);
                mouseData.velocities = mouseData.velocities.slice(-100);
            }
            
            // Enregistrer la position
            mouseData.positions.push({
                x: event.clientX,
                y: event.clientY
            });
            
            // Enregistrer le timing
            mouseData.timings.push(now);
            
            // Calculer la vitesse si ce n'est pas le premier mouvement
            if (lastTime > 0) {
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
            
            // Mettre à jour la source d'entropie tous les 10 mouvements
            if (mouseData.positions.length > 0 && mouseData.positions.length % 10 === 0) {
                this.addEntropySource('mouse', mouseData);
            }
        };
        
        // Ajouter l'écouteur d'événements avec option passive pour améliorer les performances
        document.addEventListener('mousemove', mouseListener, { passive: true });
        
        // Stocker la référence pour un nettoyage éventuel
        this.entropyCollectors.push({
            name: 'mouse',
            cleanup: () => document.removeEventListener('mousemove', mouseListener)
        });
        
        // Activer immédiatement la source d'entropie avec les données initiales
        setTimeout(() => {
            this.addEntropySource('mouse', mouseData);
        }, 500);
    };
    
    // Correction 2: Amélioration du collecteur d'entropie timing
    AppModules.Entropy.setupTimingEntropyCollector = function() {
        console.log('Configuration du collecteur d\'entropie timing');
        
        // Structure pour stocker les données de timing
        const timingData = {
            samples: [],
            differences: []
        };
        
        // Mettre à jour l'état de cette source
        AppModules.UI.updateSourceStatus('timing', 'waiting');
        
        // Fonction pour collecter un échantillon de timing de manière plus efficace
        const collectTimingSample = () => {
            // Utiliser requestAnimationFrame pour une meilleure synchronisation
            const rafStart = performance.now();
            
            requestAnimationFrame(() => {
                const rafEnd = performance.now();
                const rafDuration = rafEnd - rafStart;
                
                // Effectuer une opération pour mesurer les variations de temps d'exécution
                // Réduire le nombre d'itérations pour un impact moindre sur les performances
                const start = performance.now();
                let sum = 0;
                for (let i = 0; i < 2000; i++) {
                    sum += Math.sin(i * 0.1) * Math.cos(i * 0.1);
                }
                const end = performance.now();
                const duration = end - start;
                
                // Enregistrer les deux échantillons
                timingData.samples.push(duration);
                timingData.samples.push(rafDuration);
                
                // Calculer les différences entre échantillons successifs
                if (timingData.samples.length > 2) {
                    const lastIndex = timingData.samples.length - 1;
                    const diff1 = Math.abs(timingData.samples[lastIndex] - timingData.samples[lastIndex - 1]);
                    const diff2 = Math.abs(timingData.samples[lastIndex - 1] - timingData.samples[lastIndex - 2]);
                    timingData.differences.push(diff1);
                    timingData.differences.push(diff2);
                }
                
                // Limiter le nombre d'échantillons
                if (timingData.samples.length > 50) {
                    timingData.samples = timingData.samples.slice(-50);
                    timingData.differences = timingData.differences.slice(-49);
                }
                
                // Ajouter à l'entropie dès qu'on a des données
                if (timingData.samples.length > 4) {
                    AppModules.UI.updateSourceStatus('timing', 'collecting');
                    this.addEntropySource('timing', timingData);
                }
                
                // Continuer à collecter mais limiter la fréquence
                // pour réduire l'impact sur les performances
                setTimeout(collectTimingSample, 500);
            });
        };
        
        // Démarrer la collecte après un court délai
        setTimeout(collectTimingSample, 100);
        
        // Ajouter un événement qui exploite les jitters de l'utilisateur
        const jitterListener = (event) => {
            const interactionTime = performance.now();
            timingData.samples.push(interactionTime % 1); // Utiliser seulement la partie fractionnaire
            
            if (timingData.samples.length > 4) {
                this.addEntropySource('timing', timingData);
            }
        };
        
        // Ajouter des écouteurs pour divers événements pour capturer plus de jitter
        document.addEventListener('mousemove', jitterListener, { passive: true });
        document.addEventListener('keydown', jitterListener, { passive: true });
        document.addEventListener('click', jitterListener, { passive: true });
        
        // Stocker les références pour nettoyage
        this.entropyCollectors.push({
            name: 'timing-events',
            cleanup: () => {
                document.removeEventListener('mousemove', jitterListener);
                document.removeEventListener('keydown', jitterListener);
                document.removeEventListener('click', jitterListener);
            }
        });
    };
    
    // Correction 3: Amélioration du collecteur d'entropie réseau
    AppModules.Entropy.setupNetworkEntropyCollector = function() {
        console.log('Configuration du collecteur d\'entropie réseau');
        
        // Structure pour stocker les données de latence réseau
        const networkData = {
            latencies: [],
            timestamps: []
        };
        
        // Mettre à jour l'état de cette source
        AppModules.UI.updateSourceStatus('network', 'waiting');
        
        // Utiliser des ressources locales pour éviter les erreurs CORS
        // et réduire la surcharge réseau
        const createRandomQuery = () => {
            return `?nocache=${Date.now()}-${Math.random()}`;
        };
        
        // Fonction efficace pour mesurer la latence
        const measureLatency = () => {
            const endpoint = window.location.href + createRandomQuery();
            const timestamp = performance.now();
            
            // Utiliser fetch avec option no-cache pour des mesures plus précises
            fetch(endpoint, { 
                method: 'HEAD',
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
                mode: 'no-cors'
            })
            .then(() => {
                const latency = performance.now() - timestamp;
                
                // Enregistrer la latence
                networkData.latencies.push(latency);
                networkData.timestamps.push(timestamp);
                
                // Limiter le nombre d'échantillons
                if (networkData.latencies.length > 20) {
                    networkData.latencies = networkData.latencies.slice(-20);
                    networkData.timestamps = networkData.timestamps.slice(-20);
                }
                
                // Ajouter à l'entropie
                if (networkData.latencies.length > 0) {
                    AppModules.UI.updateSourceStatus('network', 'collecting');
                    this.addEntropySource('network', networkData);
                }
            })
            .catch(error => {
                console.warn(`Erreur de ping réseau: ${error}`);
                // En cas d'erreur, utiliser quand même le timestamp comme source d'entropie
                networkData.timestamps.push(performance.now());
                this.addEntropySource('network', networkData);
            });
        };
        
        // Démarrer avec un ping initial
        measureLatency();
        
        // Programmer des pings réguliers mais peu fréquents pour réduire la charge
        const pingInterval = setInterval(() => {
            measureLatency();
        }, 5000); // Un ping toutes les 5 secondes
        
        // Stocker la référence pour nettoyage
        this.entropyCollectors.push({
            name: 'network-pings',
            cleanup: () => clearInterval(pingInterval)
        });
        
        // Utiliser aussi les événements réseau naturels comme source d'entropie
        try {
            if (window.PerformanceObserver) {
                const performanceObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    
                    entries.forEach(entry => {
                        if (entry.entryType === 'resource') {
                            networkData.latencies.push(entry.duration);
                            networkData.timestamps.push(entry.startTime);
                            
                            if (networkData.latencies.length > 20) {
                                networkData.latencies = networkData.latencies.slice(-20);
                                networkData.timestamps = networkData.timestamps.slice(-20);
                            }
                            
                            this.addEntropySource('network', networkData);
                        }
                    });
                });
                
                // Observer les chargements de ressources
                performanceObserver.observe({ entryTypes: ['resource'] });
                
                // Stocker la référence pour nettoyage
                this.entropyCollectors.push({
                    name: 'network-observer',
                    cleanup: () => performanceObserver.disconnect()
                });
            }
        } catch (e) {
            console.warn('PerformanceObserver non supporté:', e);
        }
    };
    
    // Correction 4: Amélioration de l'activation des capteurs mobile
    AppModules.Entropy.setupSensorEntropyCollector = function() {
        console.log('Configuration du collecteur d\'entropie capteurs');
        
        // Structure pour stocker les données des capteurs
        const sensorData = {
            orientation: [],
            motion: [],
            timestamps: []
        };
        
        // Vérifier la disponibilité des API de capteurs
        const hasSensors = (
            window.DeviceOrientationEvent || 
            window.DeviceMotionEvent
        );
        
        if (!hasSensors) {
            console.log('Aucun capteur mobile détecté');
            AppModules.UI.updateSourceStatus('sensors', 'unavailable');
            return;
        }
        
        let isCollecting = false;
        
        // Mettre à jour l'état initial
        AppModules.UI.updateSourceStatus('sensors', 'waiting');
        
        // Écouter l'orientation de l'appareil avec throttling
        let lastOrientationTime = 0;
        
        if (window.DeviceOrientationEvent) {
            const orientationListener = (event) => {
                // Limiter la fréquence de collecte (200ms)
                const now = performance.now();
                if (now - lastOrientationTime < 200) {
                    return;
                }
                lastOrientationTime = now;
                
                if (!isCollecting) {
                    isCollecting = true;
                    AppModules.UI.updateSourceStatus('sensors', 'collecting');
                }
                
                if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
                    // Limiter la taille des données
                    if (sensorData.orientation.length >= 50) {
                        sensorData.orientation = sensorData.orientation.slice(-25);
                    }
                    
                    // Enregistrer les données d'orientation
                    sensorData.orientation.push({
                        alpha: event.alpha,
                        beta: event.beta,
                        gamma: event.gamma,
                        time: now
                    });
                    
                    // Mettre à jour le timestamp
                    sensorData.timestamps.push(now);
                    
                    // Ajouter à l'entropie si assez de données
                    if (sensorData.orientation.length % 5 === 0) {
                        this.addEntropySource('sensors', sensorData);
                    }
                }
            };
            
            // Ajouter l'écouteur d'événements avec option passive pour améliorer les performances
            window.addEventListener('deviceorientation', orientationListener, { passive: true });
            
            // Stocker pour nettoyage
            this.entropyCollectors.push({
                name: 'orientation',
                cleanup: () => window.removeEventListener('deviceorientation', orientationListener)
            });
        }
        
        // Écouter le mouvement de l'appareil avec throttling
        let lastMotionTime = 0;
        
        if (window.DeviceMotionEvent) {
            const motionListener = (event) => {
                // Limiter la fréquence de collecte (200ms)
                const now = performance.now();
                if (now - lastMotionTime < 200) {
                    return;
                }
                lastMotionTime = now;
                
                if (!isCollecting) {
                    isCollecting = true;
                    AppModules.UI.updateSourceStatus('sensors', 'collecting');
                }
                
                if (event.acceleration && event.rotationRate) {
                    // Limiter la taille des données
                    if (sensorData.motion.length >= 50) {
                        sensorData.motion = sensorData.motion.slice(-25);
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
                        time: now
                    });
                    
                    // Mettre à jour le timestamp
                    sensorData.timestamps.push(now);
                    
                    // Ajouter à l'entropie si assez de données
                    if (sensorData.motion.length % 5 === 0) {
                        this.addEntropySource('sensors', sensorData);
                    }
                }
            };
            
            // Ajouter l'écouteur d'événements avec option passive
            window.addEventListener('devicemotion', motionListener, { passive: true });
            
            // Stocker pour nettoyage
            this.entropyCollectors.push({
                name: 'motion',
                cleanup: () => window.removeEventListener('devicemotion', motionListener)
            });
        }
        
        // Démarrer avec des données vides
        setTimeout(() => {
            if (!isCollecting && (window.DeviceOrientationEvent || window.DeviceMotionEvent)) {
                this.addEntropySource('sensors', sensorData);
            }
        }, 1000);
    };
    
    // Correction 5: Amélioration des estimations d'entropie
    AppModules.Entropy.estimateMouseEntropy = function(mouseData) {
        if (!mouseData || !mouseData.positions || mouseData.positions.length === 0) {
            return 0;
        }
        
        // Calcul amélioré de l'entropie de la souris
        const positionEntropy = Math.min(20, mouseData.positions.length * 0.4);
        
        // Analyse des écarts entre mouvements
        let positionVariability = 0;
        if (mouseData.positions.length > 1) {
            let totalVariation = 0;
            
            for (let i = 1; i < mouseData.positions.length; i++) {
                const prevPos = mouseData.positions[i-1];
                const currPos = mouseData.positions[i];
                
                // Calculer la distance entre positions successives
                const dx = currPos.x - prevPos.x;
                const dy = currPos.y - prevPos.y;
                totalVariation += Math.sqrt(dx*dx + dy*dy);
            }
            
            // Normaliser et limiter
            positionVariability = Math.min(10, totalVariation / mouseData.positions.length * 0.1);
        }
        
        // Entropie des vitesses
        let velocityEntropy = 0;
        if (mouseData.velocities && mouseData.velocities.length > 1) {
            let velocityVariation = 0;
            
            for (let i = 1; i < mouseData.velocities.length; i++) {
                velocityVariation += Math.abs(mouseData.velocities[i] - mouseData.velocities[i-1]);
            }
            
            velocityEntropy = Math.min(10, velocityVariation / mouseData.velocities.length * 0.2);
        }
        
        // Entropie des timings
        let timingEntropy = 0;
        if (mouseData.timings && mouseData.timings.length > 1) {
            let timingVariation = 0;
            
            for (let i = 1; i < mouseData.timings.length; i++) {
                // Utiliser seulement la partie fractionnaire du temps pour mieux capturer l'entropie
                const t1 = mouseData.timings[i-1] % 1;
                const t2 = mouseData.timings[i] % 1;
                timingVariation += Math.abs(t2 - t1);
            }
            
            timingEntropy = Math.min(8, timingVariation * 3);
        }
        
        return Math.round(positionEntropy + positionVariability + velocityEntropy + timingEntropy);
    };
    
    AppModules.Entropy.estimateTimingEntropy = function(timingData) {
        if (!timingData || !timingData.samples || timingData.samples.length === 0) {
            return 0;
        }
        
        // Analyse plus précise de la variabilité des timings
        let statsEntropy = 0;
        if (timingData.samples.length > 5) {
            // Calculer la moyenne et l'écart-type
            let sum = 0;
            let sumSq = 0;
            
            for (let i = 0; i < timingData.samples.length; i++) {
                // Utiliser la partie fractionnaire pour la variabilité
                const value = timingData.samples[i] % 1; 
                sum += value;
                sumSq += value * value;
            }
            
            const mean = sum / timingData.samples.length;
            const variance = (sumSq / timingData.samples.length) - (mean * mean);
            const stdDev = Math.sqrt(Math.max(0, variance));
            
            // Une plus grande variabilité indique plus d'entropie
            statsEntropy = Math.min(15, stdDev * 50);
        }
        
        // Entropie des différences de timing
        let diffEntropy = 0;
        if (timingData.differences && timingData.differences.length > 0) {
            let diffSum = 0;
            
            for (let i = 0; i < timingData.differences.length; i++) {
                diffSum += timingData.differences[i];
            }
            
            const avgDiff = diffSum / timingData.differences.length;
            diffEntropy = Math.min(10, avgDiff * 5);
        }
        
        return Math.round(statsEntropy + diffEntropy + Math.min(5, timingData.samples.length * 0.2));
    };
    
    AppModules.Entropy.estimateNetworkEntropy = function(networkData) {
        if (!networkData || !networkData.latencies || networkData.latencies.length === 0) {
            return 0;
        }
        
        // Analyse de la variabilité des latences
        let latencyVariability = 0;
        if (networkData.latencies.length > 1) {
            let totalVariation = 0;
            
            for (let i = 1; i < networkData.latencies.length; i++) {
                totalVariation += Math.abs(networkData.latencies[i] - networkData.latencies[i-1]);
            }
            
            latencyVariability = Math.min(8, totalVariation / networkData.latencies.length * 0.1);
        }
        
        // Entropie des timestamps
        let timestampEntropy = 0;
        if (networkData.timestamps && networkData.timestamps.length > 0) {
            for (let i = 0; i < networkData.timestamps.length; i++) {
                // Utiliser la partie fractionnaire du timestamp comme source d'entropie
                const fraction = networkData.timestamps[i] % 1;
                timestampEntropy += fraction * 0.1;
            }
            
            timestampEntropy = Math.min(6, timestampEntropy);
        }
        
        return Math.round(latencyVariability + timestampEntropy + 
                         Math.min(6, networkData.latencies.length * 0.5));
    };
    
    AppModules.Entropy.estimateSensorEntropy = function(sensorData) {
        let entropy = 0;
        
        // Entropie des données d'orientation
        if (sensorData.orientation && sensorData.orientation.length > 0) {
            let orientationVariability = 0;
            
            // Calculer la variabilité des angles d'orientation
            for (let i = 1; i < sensorData.orientation.length; i++) {
                const prev = sensorData.orientation[i-1];
                const curr = sensorData.orientation[i];
                
                orientationVariability += 
                    Math.abs(curr.alpha - prev.alpha) / 360 +
                    Math.abs(curr.beta - prev.beta) / 180 +
                    Math.abs(curr.gamma - prev.gamma) / 180;
            }
            
            // Normaliser et limiter
            entropy += Math.min(20, sensorData.orientation.length * 0.5 + orientationVariability * 5);
        }
        
        // Entropie des données de mouvement
        if (sensorData.motion && sensorData.motion.length > 0) {
            let motionVariability = 0;
            
            // Calculer la variabilité des mesures d'accélération et de rotation
            for (let i = 1; i < sensorData.motion.length; i++) {
                const prev = sensorData.motion[i-1];
                const curr = sensorData.motion[i];
                
                const accelDiff = 
                    Math.abs(curr.x - prev.x) + 
                    Math.abs(curr.y - prev.y) + 
                    Math.abs(curr.z - prev.z);
                    
                const rotDiff = 
                    Math.abs(curr.alpha - prev.alpha) + 
                    Math.abs(curr.beta - prev.beta) + 
                    Math.abs(curr.gamma - prev.gamma);
                    
                motionVariability += accelDiff * 0.2 + rotDiff * 0.1;
            }
            
            // Normaliser et limiter
            entropy += Math.min(25, sensorData.motion.length * 0.8 + motionVariability * 2);
        }
        
        // Entropie des timestamps
        if (sensorData.timestamps && sensorData.timestamps.length > 1) {
            let timestampEntropy = 0;
            
            for (let i = 1; i < sensorData.timestamps.length; i++) {
                // Utiliser la partie fractionnaire pour capturer la micro-variabilité
                const t1 = sensorData.timestamps[i-1] % 1;
                const t2 = sensorData.timestamps[i] % 1;
                timestampEntropy += Math.abs(t2 - t1);
            }
            
            entropy += Math.min(5, timestampEntropy * 10);
        }
        
        return Math.round(entropy);
    };
    
    // Correction 6: Amélioration de la génération de graine
    AppModules.Entropy.generateSeed = async function() {
        console.log('Génération de graine cryptographique à partir de l\'entropie collectée');
        
        // Créer un pool d'entropie plus riche et plus robuste
        const entropyPool = new Uint8Array(64); // 512 bits
        
        // Remplir initialement avec des valeurs aléatoires cryptographiques
        window.crypto.getRandomValues(entropyPool);
        
        // Fonction pour incorporer des données dans le pool d'entropie
        const incorporateData = async (data, weight = 1) => {
            if (!data) return;
            
            // Sérialiser les données
            const jsonString = JSON.stringify(data);
            const dataArray = new TextEncoder().encode(jsonString);
            
            // Hacher les données pour obtenir une distribution uniforme
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataArray);
            const hashArray = new Uint8Array(hashBuffer);
            
            // Incorporer dans le pool avec un XOR pondéré
            for (let i = 0; i < hashArray.length && i < entropyPool.length; i++) {
                // Mélanger avec l'index pour éviter les motifs
                const j = (i * 17 + 5) % entropyPool.length;
                entropyPool[j] = (entropyPool[j] * (1 - weight) + hashArray[i] * weight) & 0xFF;
            }
        };
        
        // Incorporer les différentes sources d'entropie avec des poids appropriés
        
        // L'audio est la source primaire
        if (this.entropySources.audio) {
            await incorporateData(this.entropySources.audio, 0.4);
        }
        
        // Les sources secondaires
        if (this.entropySources.mouse) {
            await incorporateData(this.entropySources.mouse, 0.15);
        }
        
        if (this.entropySources.timing) {
            await incorporateData(this.entropySources.timing, 0.1);
        }
        
        if (this.entropySources.network) {
            await incorporateData(this.entropySources.network, 0.1);
        }
        
        if (this.entropySources.sensors) {
            await incorporateData(this.entropySources.sensors, 0.15);
        }
        
        if (this.entropySources.system) {
            await incorporateData(this.entropySources.system, 0.1);
        }
        
        // Ajouter une source finale high-precision time
        const finalData = {
            time: performance.now(),
            random: Array.from(crypto.getRandomValues(new Uint8Array(16))),
            date: new Date().getTime()
        };
        await incorporateData(finalData, 0.2);
        
        // Hacher le pool final pour uniformiser
        const finalHash = await window.crypto.subtle.digest('SHA-256', entropyPool);
        const seed = Array.from(new Uint8Array(finalHash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        return seed;
    };
    
    console.log("Améliorations des collecteurs d'entropie appliquées avec succès!");
}

// Exécuter l'amélioration des collecteurs d'entropie quand le document est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Attendre un peu pour s'assurer que AppModules est chargé
    setTimeout(enhanceEntropyCollectors, 700);
});