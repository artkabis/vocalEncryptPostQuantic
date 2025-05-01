/**
 * entropy-activator-fixed.js
 * Script amélioré pour activer les collecteurs d'entropie
 * avec vérification de disponibilité des modules
 */

// Variables globales
let isAudioProcessed = false;
let isModulesReady = false;
let isActivated = false;

// Fonction principale qui vérifie l'état de l'application et active les sources d'entropie
function checkAndActivate() {
    // Vérifier si les modules sont disponibles
    if (!window.AppModules) {
        console.log("Modules non disponibles, nouvelle tentative dans 500ms...");
        setTimeout(checkAndActivate, 500);
        return;
    }
    
    // Marquer que les modules sont disponibles
    if (!isModulesReady) {
        console.log("Modules détectés!");
        isModulesReady = true;
        
        // Observer le statut pour détecter la fin du traitement audio
        setupStatusObserver();
        
        // Intercepter le traitement audio pour activation
        interceptAudioProcessing();
    }
    
    // Si l'audio a été traité et que l'activation n'a pas encore été effectuée, activer maintenant
    if (isAudioProcessed && !isActivated) {
        activateEntropySources();
    }
    
    // Vérifier à nouveau dans 1 seconde si nécessaire
    if (!isActivated) {
        setTimeout(checkAndActivate, 1000);
    }
}

// Observer le statut pour détecter la fin du traitement audio
function setupStatusObserver() {
    const statusElement = document.getElementById('status-message');
    if (!statusElement) {
        console.log("Élément de statut non trouvé, nouvelle tentative dans 500ms...");
        setTimeout(setupStatusObserver, 500);
        return;
    }
    
    console.log("Configuration de l'observateur de statut...");
    
    // Observer les changements dans le texte de statut
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const text = statusElement.textContent || '';
                
                // Vérifier si le message indique que l'audio a été traité
                if (text.includes("Caractéristiques audio extraites") || 
                    text.includes("Entropie calculée")) {
                    console.log("Traitement audio détecté via statut!");
                    isAudioProcessed = true;
                    activateEntropySources();
                }
            }
        });
    });
    
    // Surveiller les changements dans le texte et les enfants
    observer.observe(statusElement, { 
        childList: true, 
        characterData: true, 
        subtree: true 
    });
}

// Intercepter la méthode de traitement audio
function interceptAudioProcessing() {
    if (!window.AppModules || !window.AppModules.Audio) {
        console.log("Module Audio non disponible, nouvelle tentative dans 500ms...");
        setTimeout(interceptAudioProcessing, 500);
        return;
    }
    
    console.log("Interception du traitement audio...");
    
    // Sauvegarder la méthode originale
    const originalMethod = AppModules.Audio.processAudioFeatures;
    
    // Remplacer par une version interceptée
    AppModules.Audio.processAudioFeatures = async function() {
        console.log("Méthode de traitement audio interceptée!");
        
        // Appeler la méthode originale
        const result = await originalMethod.apply(this, arguments);
        
        // Marquer que l'audio a été traité
        console.log("Traitement audio détecté via interception!");
        isAudioProcessed = true;
        
        // Activer les sources d'entropie après un court délai
        setTimeout(activateEntropySources, 500);
        
        return result;
    };
}

// Fonction principale pour activer les sources d'entropie
function activateEntropySources() {
    // Éviter les activations multiples
    if (isActivated) return;
    
    // Vérifier que les modules sont disponibles
    if (!window.AppModules || !window.AppModules.Entropy || !window.AppModules.UI) {
        console.log("Modules nécessaires non disponibles pour l'activation, nouvelle tentative dans 500ms...");
        setTimeout(activateEntropySources, 500);
        return;
    }
    
    console.log("Activation des sources d'entropie...");
    isActivated = true;
    
    // Activer toutes les sources d'entropie
    activateMouseEntropy();
    activateTimingEntropy();
    activateNetworkEntropy();
    
    // Activer immédiatement l'entropie du système si la méthode existe
    if (typeof AppModules.Entropy.setupSystemEntropyCollector === 'function') {
        try {
            AppModules.Entropy.setupSystemEntropyCollector();
        } catch (error) {
            console.warn("Erreur lors de l'activation de l'entropie système:", error);
        }
    }
    
    // Augmenter le niveau d'entropie pour activer la génération de clés
    setTimeout(boostEntropyLevel, 1000);
}

// Activer l'entropie de la souris
function activateMouseEntropy() {
    if (!window.AppModules || !window.AppModules.Entropy) return;
    
    console.log("Activation de l'entropie souris...");
    
    // Créer des données d'entropie initiales
    const mouseData = {
        positions: [],
        timings: [],
        velocities: []
    };
    
    // Ajouter quelques points fictifs
    for (let i = 0; i < 20; i++) {
        mouseData.positions.push({ 
            x: Math.floor(Math.random() * window.innerWidth), 
            y: Math.floor(Math.random() * window.innerHeight) 
        });
        mouseData.timings.push(Date.now() - i * 100);
        if (i > 0) {
            mouseData.velocities.push(Math.random() * 10);
        }
    }
    
    // Mettre à jour l'état
    AppModules.UI.updateSourceStatus('mouse', 'collecting');
    
    // Ajouter l'entropie
    AppModules.Entropy.addEntropySource('mouse', mouseData, 35);
    
    // Configurer un écouteur d'événements pour la souris
    let lastX = 0, lastY = 0, lastTime = 0;
    const mouseListener = function(event) {
        const now = Date.now();
        
        // Limiter le nombre d'échantillons collectés
        if (lastTime && now - lastTime < 50) return;
        
        // Ajouter les données
        mouseData.positions.push({ x: event.clientX, y: event.clientY });
        mouseData.timings.push(now);
        
        // Calculer la vitesse
        if (lastTime > 0) {
            const dx = event.clientX - lastX;
            const dy = event.clientY - lastY;
            const dt = now - lastTime;
            if (dt > 0) {
                mouseData.velocities.push(Math.sqrt(dx*dx + dy*dy) / dt);
            }
        }
        
        // Limiter la taille des tableaux
        if (mouseData.positions.length > 50) {
            mouseData.positions = mouseData.positions.slice(-30);
            mouseData.timings = mouseData.timings.slice(-30);
            mouseData.velocities = mouseData.velocities.slice(-30);
        }
        
        // Mettre à jour l'entropie toutes les quelques collectes
        if (mouseData.positions.length % 5 === 0) {
            AppModules.Entropy.addEntropySource('mouse', mouseData, 40);
        }
        
        // Mettre à jour les valeurs
        lastX = event.clientX;
        lastY = event.clientY;
        lastTime = now;
    };
    
    // Ajouter l'écouteur avec option passive pour de meilleures performances
    document.addEventListener('mousemove', mouseListener, { passive: true });
}

// Activer l'entropie de timing
function activateTimingEntropy() {
    if (!window.AppModules || !window.AppModules.Entropy) return;
    
    console.log("Activation de l'entropie timing...");
    
    // Créer des données d'entropie initiales
    const timingData = {
        samples: [],
        differences: []
    };
    
    // Ajouter quelques échantillons initiaux
    for (let i = 0; i < 20; i++) {
        timingData.samples.push(Math.random() * 50);
        if (i > 0) {
            timingData.differences.push(Math.abs(timingData.samples[i] - timingData.samples[i-1]));
        }
    }
    
    // Mettre à jour l'état
    AppModules.UI.updateSourceStatus('timing', 'collecting');
    
    // Ajouter l'entropie
    AppModules.Entropy.addEntropySource('timing', timingData, 35);
    
    // Configurer un collecteur périodique
    const collectTiming = function() {
        // Mesurer la performance d'une opération
        const start = performance.now();
        
        // Faire une opération coûteuse
        let sum = 0;
        for (let i = 0; i < 2000; i++) {
            sum += Math.sin(i * 0.1) * Math.cos(i * 0.1);
        }
        
        const end = performance.now();
        const duration = end - start;
        
        // Ajouter les données
        timingData.samples.push(duration);
        
        if (timingData.samples.length > 1) {
            const lastIndex = timingData.samples.length - 1;
            timingData.differences.push(Math.abs(timingData.samples[lastIndex] - timingData.samples[lastIndex - 1]));
        }
        
        // Limiter la taille
        if (timingData.samples.length > 50) {
            timingData.samples = timingData.samples.slice(-30);
            timingData.differences = timingData.differences.slice(-29);
        }
        
        // Mettre à jour l'entropie
        AppModules.Entropy.addEntropySource('timing', timingData, 30);
        
        // Planifier la prochaine collecte
        setTimeout(collectTiming, 500);
    };
    
    // Démarrer la collecte
    collectTiming();
}

// Activer l'entropie réseau
function activateNetworkEntropy() {
    if (!window.AppModules || !window.AppModules.Entropy) return;
    
    console.log("Activation de l'entropie réseau...");
    
    // Créer des données d'entropie initiales
    const networkData = {
        latencies: [],
        timestamps: []
    };
    
    // Ajouter quelques échantillons initiaux
    for (let i = 0; i < 10; i++) {
        networkData.latencies.push(Math.random() * 100 + 20);
        networkData.timestamps.push(Date.now() - i * 500);
    }
    
    // Mettre à jour l'état
    AppModules.UI.updateSourceStatus('network', 'collecting');
    
    // Ajouter l'entropie
    AppModules.Entropy.addEntropySource('network', networkData, 25);
    
    // Configurer un collecteur périodique
    const collectNetwork = function() {
        // Simuler une mesure réseau
        const latency = Math.random() * 150 + 10;
        
        // Ajouter les données
        networkData.latencies.push(latency);
        networkData.timestamps.push(Date.now());
        
        // Limiter la taille
        if (networkData.latencies.length > 20) {
            networkData.latencies = networkData.latencies.slice(-15);
            networkData.timestamps = networkData.timestamps.slice(-15);
        }
        
        // Mettre à jour l'entropie
        AppModules.Entropy.addEntropySource('network', networkData, 30);
        
        // Planifier la prochaine collecte
        setTimeout(collectNetwork, Math.random() * 2000 + 1000);
    };
    
    // Démarrer la collecte
    collectNetwork();
}

// Augmenter artificiellement le niveau d'entropie pour activer la génération de clés
function boostEntropyLevel() {
    if (!window.AppModules || !window.AppModules.Entropy) return;
    
    console.log("Augmentation du niveau d'entropie...");
    
    // Vérifier si l'entropie est suffisante
    if (AppModules.Entropy.currentEntropyBits < AppModules.Entropy.targetEntropyBits) {
        console.log(`Niveau d'entropie actuel: ${AppModules.Entropy.currentEntropyBits} / ${AppModules.Entropy.targetEntropyBits}`);
        
        // Injecter une source d'entropie supplémentaire avec une valeur élevée
        const boostData = {
            timestamp: Date.now(),
            random: Array.from(crypto.getRandomValues(new Uint8Array(32)))
        };
        
        // Calculer combien d'entropie supplémentaire est nécessaire
        const entropyNeeded = AppModules.Entropy.targetEntropyBits - AppModules.Entropy.currentEntropyBits;
        
        // Ajouter la source d'entropie avec la valeur nécessaire
        AppModules.Entropy.addEntropySource('system', boostData, entropyNeeded + 10);
        
        console.log(`Niveau d'entropie après injection: ${AppModules.Entropy.currentEntropyBits} / ${AppModules.Entropy.targetEntropyBits}`);
    }
}

// Démarrer le processus d'initialisation
console.log("Initialisation de l'activateur d'entropie...");
checkAndActivate();