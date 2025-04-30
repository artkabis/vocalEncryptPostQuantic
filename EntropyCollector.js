/**
 * EntropyCollector.js
 * 
 * Module d'entropie avancée pour renforcer la génération de clés post-quantiques.
 * Ce module collecte l'entropie de multiples sources naturelles et systèmes
 * sans nécessiter d'équipements coûteux.
 * 
 * Peut être intégré facilement à une application existante de génération de clés.
 */

// Classe principale du collecteur d'entropie
class EntropyCollector {
    constructor(options = {}) {
      // Configuration par défaut
      this.config = {
        // Nombre d'échantillons à collecter pour chaque source
        audioSamples: options.audioSamples || 8192,
        motionSamples: options.motionSamples || 1000,
        timingIterations: options.timingIterations || 10000,
        // Sources à utiliser (toutes activées par défaut)
        useMicrophone: options.useMicrophone !== undefined ? options.useMicrophone : true,
        useMotionSensors: options.useMotionSensors !== undefined ? options.useMotionSensors : true,
        useTimingJitter: options.useTimingJitter !== undefined ? options.useTimingJitter : true,
        useNetworkJitter: options.useNetworkJitter !== undefined ? options.useNetworkJitter : true,
        useUserInteraction: options.useUserInteraction !== undefined ? options.useUserInteraction : true,
        // Niveau d'entropie visé (en bits estimés)
        targetEntropyBits: options.targetEntropyBits || 256,
        // Callbacks
        onProgress: options.onProgress || (() => {}),
        onError: options.onError || ((error) => console.error(error))
      };
      
      // État interne
      this.entropyPool = null;
      this.entropyCollected = 0;
      this.sourceResults = {};
      this.isCollecting = false;
    }
    
    /**
     * Démarre la collecte d'entropie à partir de toutes les sources configurées
     * @returns {Promise<Uint8Array>} Un tableau d'octets contenant l'entropie collectée
     */
    async collectEntropy() {
      if (this.isCollecting) {
        throw new Error("Collecte d'entropie déjà en cours");
      }
      
      try {
        this.isCollecting = true;
        this.entropyCollected = 0;
        this.sourceResults = {};
        this.entropyPool = new Uint8Array(1024); // Pool d'entropie de 1024 octets
        
        // Initialiser le pool avec des valeurs aléatoires cryptographiques
        crypto.getRandomValues(this.entropyPool);
        
        // Mettre à jour le statut
        this._updateProgress(0, "Initialisation du système");
        
        // Collecter l'entropie de chaque source activée
        const collectionPromises = [];
        
        if (this.config.useMicrophone) {
          collectionPromises.push(this._collectAtmosphericNoise());
        }
        
        if (this.config.useMotionSensors) {
          collectionPromises.push(this._collectMotionEntropy());
        }
        
        if (this.config.useTimingJitter) {
          collectionPromises.push(this._collectTimingJitter());
        }
        
        if (this.config.useNetworkJitter) {
          collectionPromises.push(this._collectNetworkJitter());
        }
        
        if (this.config.useUserInteraction) {
          collectionPromises.push(this._collectUserInteractionEntropy());
        }
        
        // Toujours collecter l'entropie du système (peu coûteux mais utile)
        collectionPromises.push(this._collectSystemEntropy());
        
        // Attendre que toutes les sources terminent la collecte
        await Promise.all(collectionPromises);
        
        // Finaliser le pool d'entropie
        this._updateProgress(90, "Finalisation du pool d'entropie");
        
        const finalEntropy = await this._finalizeEntropyPool();
        
        this._updateProgress(100, "Collecte d'entropie terminée");
        this.isCollecting = false;
        
        return finalEntropy;
        
      } catch (error) {
        this.isCollecting = false;
        this.config.onError(error);
        throw error;
      }
    }
    
    /**
     * Collecte le bruit atmosphérique via le microphone
     * @private
     */
    async _collectAtmosphericNoise() {
      try {
        this._updateProgress(10, "Collecte du bruit atmosphérique");
        
        // Vérifier si le navigateur prend en charge l'API audio
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("L'API Audio n'est pas prise en charge par ce navigateur");
        }
        
        // Accéder au microphone avec des paramètres optimisés pour le bruit
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1
          }
        });
        
        // Configurer l'analyse audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        
        source.connect(analyser);
        analyser.fftSize = this.config.audioSamples;
        
        // Collecter des échantillons audio bruts
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Attendre un court instant pour obtenir des données significatives
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Capturer les données audio
        analyser.getByteTimeDomainData(dataArray);
        
        // Arrêter le flux audio
        stream.getTracks().forEach(track => track.stop());
        
        // Incorporer les données dans le pool d'entropie
        this._incorporateData(dataArray, "microphone");
        
        this._updateProgress(25, "Bruit atmosphérique collecté");
        
      } catch (error) {
        console.warn("Impossible de collecter le bruit atmosphérique:", error);
        // Continuer avec d'autres sources si celle-ci échoue
      }
    }
    
    /**
     * Collecte l'entropie des capteurs de mouvement
     * @private
     */
    async _collectMotionEntropy() {
      return new Promise(async (resolve) => {
        try {
          this._updateProgress(20, "Collecte des données de mouvement");
          
          // Vérifier si les capteurs de mouvement sont disponibles
          if (!window.DeviceMotionEvent) {
            throw new Error("Les capteurs de mouvement ne sont pas disponibles");
          }
          
          const samples = [];
          let sampleCount = 0;
          const targetSamples = this.config.motionSamples;
          
          // Gestionnaire d'événements de mouvement
          const motionHandler = (event) => {
            // Capturer des valeurs à haute précision
            const timestamp = performance.now();
            
            // Collecter toutes les données disponibles
            samples.push(
              timestamp,
              event.accelerationIncludingGravity?.x || 0,
              event.accelerationIncludingGravity?.y || 0,
              event.accelerationIncludingGravity?.z || 0,
              event.acceleration?.x || 0,
              event.acceleration?.y || 0,
              event.acceleration?.z || 0,
              event.rotationRate?.alpha || 0,
              event.rotationRate?.beta || 0,
              event.rotationRate?.gamma || 0,
              event.interval || 0
            );
            
            sampleCount++;
            
            // Mettre à jour la progression
            if (sampleCount % 100 === 0) {
              const progress = Math.min(35, 20 + (sampleCount / targetSamples) * 15);
              this._updateProgress(progress, `Collecte des données de mouvement (${sampleCount}/${targetSamples})`);
            }
            
            // Arrêter la collecte une fois le nombre d'échantillons atteint
            if (sampleCount >= targetSamples) {
              window.removeEventListener('devicemotion', motionHandler);
              
              // Convertir les échantillons en tableau d'octets
              const dataArray = new Float64Array(samples);
              const byteArray = new Uint8Array(dataArray.buffer);
              
              // Incorporer les données dans le pool d'entropie
              this._incorporateData(byteArray, "motion");
              
              this._updateProgress(35, "Données de mouvement collectées");
              resolve();
            }
          };
          
          // Démarrer la collecte
          window.addEventListener('devicemotion', motionHandler);
          
          // Définir un délai maximum pour la collecte
          setTimeout(() => {
            if (sampleCount < targetSamples) {
              window.removeEventListener('devicemotion', motionHandler);
              
              if (sampleCount > 0) {
                // Utiliser ce qui a été collecté
                const dataArray = new Float64Array(samples);
                const byteArray = new Uint8Array(dataArray.buffer);
                this._incorporateData(byteArray, "motion");
                this._updateProgress(35, `Données de mouvement partielles collectées (${sampleCount}/${targetSamples})`);
              } else {
                console.warn("Aucune donnée de mouvement n'a pu être collectée");
              }
              
              resolve();
            }
          }, 5000); // 5 secondes maximum
          
        } catch (error) {
          console.warn("Impossible de collecter les données de mouvement:", error);
          resolve(); // Continuer avec d'autres sources
        }
      });
    }
    
    /**
     * Collecte l'entropie du jitter de timing CPU
     * @private
     */
    async _collectTimingJitter() {
      try {
        this._updateProgress(30, "Collecte du jitter de timing");
        
        const iterations = this.config.timingIterations;
        const timings = new Float64Array(iterations);
        
        // Diviser les itérations en blocs pour permettre les mises à jour de progression
        const blockSize = 1000;
        const numBlocks = Math.ceil(iterations / blockSize);
        
        for (let block = 0; block < numBlocks; block++) {
          const startIdx = block * blockSize;
          const endIdx = Math.min((block + 1) * blockSize, iterations);
          
          for (let i = startIdx; i < endIdx; i++) {
            const start = performance.now();
            
            // Opération qui sera affectée par les interruptions système
            // Utilisation de Math.sin et Math.cos qui sont sensibles au timing
            const x = Math.sin(i * 0.01) * Math.cos(i * 0.01);
            
            // Ajouter quelques opérations supplémentaires pour augmenter le jitter
            const y = Math.sqrt(Math.abs(x)) + Math.log(1 + Math.abs(x));
            
            // Capturer le timing avec précision maximale
            timings[i] = performance.now() - start;
          }
          
          // Mise à jour de la progression
          const progress = Math.min(45, 30 + (block / numBlocks) * 15);
          this._updateProgress(progress, `Collecte du jitter de timing (${Math.min((block + 1) * blockSize, iterations)}/${iterations})`);
          
          // Permettre au navigateur de respirer
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Convertir les timings en tableau d'octets
        const byteArray = new Uint8Array(timings.buffer);
        
        // Incorporer dans le pool d'entropie
        this._incorporateData(byteArray, "timing");
        
        this._updateProgress(45, "Jitter de timing collecté");
        
      } catch (error) {
        console.warn("Impossible de collecter le jitter de timing:", error);
        // Continuer avec d'autres sources
      }
    }
    
    /**
     * Collecte l'entropie du jitter réseau
     * @private
     */
    async _collectNetworkJitter() {
      try {
        this._updateProgress(40, "Collecte du jitter réseau");
        
        const samples = [];
        const urls = [
          'https://www.google.com/favicon.ico',
          'https://www.microsoft.com/favicon.ico',
          'https://www.cloudflare.com/favicon.ico',
          'https://www.github.com/favicon.ico',
          'https://www.wikipedia.org/favicon.ico'
        ];
        
        // Utiliser des en-têtes nocache pour éviter que le navigateur ne cache les réponses
        const fetchOptions = {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        };
        
        // Faire plusieurs requêtes à chaque URL
        for (let i = 0; i < 5; i++) {
          for (const url of urls) {
            const startTime = performance.now();
            try {
              await fetch(url + '?nocache=' + Date.now(), fetchOptions);
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              // Stocker la durée précise avec timestamp
              samples.push({
                url,
                duration,
                timestamp: endTime
              });
            } catch (e) {
              // Ignorer les erreurs, mais enregistrer le timestamp de l'erreur
              samples.push({
                url,
                error: true,
                timestamp: performance.now()
              });
            }
          }
          
          // Mise à jour de la progression
          this._updateProgress(40 + i * 3, `Collecte du jitter réseau (${i + 1}/5)`);
        }
        
        // Convertir les données en chaîne JSON puis en tableau d'octets
        const jsonString = JSON.stringify(samples);
        const encoder = new TextEncoder();
        const byteArray = encoder.encode(jsonString);
        
        // Incorporer dans le pool d'entropie
        this._incorporateData(byteArray, "network");
        
        this._updateProgress(55, "Jitter réseau collecté");
        
      } catch (error) {
        console.warn("Impossible de collecter le jitter réseau:", error);
        // Continuer avec d'autres sources
      }
    }
    
    /**
     * Collecte l'entropie des interactions utilisateur
     * @private
     */
    async _collectUserInteractionEntropy() {
      return new Promise((resolve) => {
        try {
          this._updateProgress(50, "Collecte des interactions utilisateur");
          
          // Créer une interface utilisateur pour la collecte
          const containerDiv = document.createElement('div');
          containerDiv.style.position = 'fixed';
          containerDiv.style.top = '0';
          containerDiv.style.left = '0';
          containerDiv.style.width = '100%';
          containerDiv.style.height = '100%';
          containerDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          containerDiv.style.zIndex = '10000';
          containerDiv.style.display = 'flex';
          containerDiv.style.flexDirection = 'column';
          containerDiv.style.alignItems = 'center';
          containerDiv.style.justifyContent = 'center';
          containerDiv.style.color = 'white';
          containerDiv.style.fontFamily = 'Arial, sans-serif';
          
          // Message d'instruction
          const messageDiv = document.createElement('div');
          messageDiv.textContent = 'Veuillez déplacer votre souris/doigt de manière aléatoire sur cette zone';
          messageDiv.style.marginBottom = '20px';
          messageDiv.style.fontSize = '18px';
          
          // Zone de dessin/interaction
          const canvasDiv = document.createElement('div');
          canvasDiv.style.width = '80%';
          canvasDiv.style.height = '300px';
          canvasDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          canvasDiv.style.border = '1px solid rgba(255, 255, 255, 0.3)';
          canvasDiv.style.borderRadius = '10px';
          canvasDiv.style.position = 'relative';
          
          // Barre de progression
          const progressBarContainer = document.createElement('div');
          progressBarContainer.style.width = '80%';
          progressBarContainer.style.height = '10px';
          progressBarContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          progressBarContainer.style.borderRadius = '5px';
          progressBarContainer.style.marginTop = '20px';
          progressBarContainer.style.overflow = 'hidden';
          
          const progressBar = document.createElement('div');
          progressBar.style.width = '0%';
          progressBar.style.height = '100%';
          progressBar.style.backgroundColor = '#3b82f6';
          progressBar.style.transition = 'width 0.3s';
          
          progressBarContainer.appendChild(progressBar);
          
          // Ajouter à la hiérarchie
          containerDiv.appendChild(messageDiv);
          containerDiv.appendChild(canvasDiv);
          containerDiv.appendChild(progressBarContainer);
          document.body.appendChild(containerDiv);
          
          // Données de collecte
          const interactions = [];
          let collectCount = 0;
          const targetSamples = 500; // Nombre d'échantillons à collecter
          
          // Créer des points visuels pour le feedback
          const createPoint = (x, y) => {
            const point = document.createElement('div');
            point.style.position = 'absolute';
            point.style.width = '5px';
            point.style.height = '5px';
            point.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
            point.style.borderRadius = '50%';
            point.style.left = `${x}px`;
            point.style.top = `${y}px`;
            point.style.transform = 'translate(-50%, -50%)';
            point.style.opacity = '0.7';
            
            canvasDiv.appendChild(point);
            
            // Faire disparaître le point après un certain temps
            setTimeout(() => {
              point.style.opacity = '0';
              point.style.transition = 'opacity 0.5s';
              setTimeout(() => point.remove(), 500);
            }, 1000);
          };
          
          // Gestionnaire d'événements pour la souris/toucher
          const handleInteraction = (e) => {
            const rect = canvasDiv.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            
            // Horodatage haute précision
            const timestamp = performance.now();
            
            // Créer un point visuel
            createPoint(x, y);
            
            // Stocker les détails de l'interaction
            interactions.push({
              x,
              y,
              timestamp,
              pressure: e.pressure || 0,
              pointerType: e.pointerType || 'mouse',
              button: e.button || 0,
              buttons: e.buttons || 0
            });
            
            collectCount++;
            
            // Mettre à jour la barre de progression
            const progressPercentage = Math.min(100, (collectCount / targetSamples) * 100);
            progressBar.style.width = `${progressPercentage}%`;
            
            // Mettre à jour le statut global
            const globalProgress = Math.min(70, 50 + (collectCount / targetSamples) * 20);
            this._updateProgress(globalProgress, `Collecte des interactions utilisateur (${collectCount}/${targetSamples})`);
            
            // Terminer la collecte une fois l'objectif atteint
            if (collectCount >= targetSamples) {
              canvasDiv.removeEventListener('mousemove', handleInteraction);
              canvasDiv.removeEventListener('touchmove', handleInteraction);
              
              // Convertir les données en chaîne JSON puis en tableau d'octets
              const jsonString = JSON.stringify(interactions);
              const encoder = new TextEncoder();
              const byteArray = encoder.encode(jsonString);
              
              // Incorporer dans le pool d'entropie
              this._incorporateData(byteArray, "userInteraction");
              
              // Retirer l'interface
              document.body.removeChild(containerDiv);
              
              this._updateProgress(70, "Interactions utilisateur collectées");
              resolve();
            }
          };
          
          // Ajouter des gestionnaires d'événements
          canvasDiv.addEventListener('mousemove', handleInteraction);
          canvasDiv.addEventListener('touchmove', handleInteraction, { passive: true });
          
          // Définir un délai maximum pour la collecte
          setTimeout(() => {
            if (collectCount < targetSamples) {
              canvasDiv.removeEventListener('mousemove', handleInteraction);
              canvasDiv.removeEventListener('touchmove', handleInteraction);
              
              if (collectCount > 0) {
                // Utiliser ce qui a été collecté
                const jsonString = JSON.stringify(interactions);
                const encoder = new TextEncoder();
                const byteArray = encoder.encode(jsonString);
                this._incorporateData(byteArray, "userInteraction");
              }
              
              // Retirer l'interface
              document.body.removeChild(containerDiv);
              
              this._updateProgress(70, `Interactions utilisateur partiellement collectées (${collectCount}/${targetSamples})`);
              resolve();
            }
          }, 20000); // 20 secondes maximum
          
        } catch (error) {
          console.warn("Impossible de collecter les interactions utilisateur:", error);
          resolve(); // Continuer avec d'autres sources
        }
      });
    }
    
    /**
     * Collecte diverses informations système pour l'entropie
     * @private
     */
    async _collectSystemEntropy() {
      try {
        this._updateProgress(60, "Collecte des informations système");
        
        // Informations système diverses
        const systemInfo = {
          // Informations sur le navigateur et l'appareil
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages,
          platform: navigator.platform,
          vendor: navigator.vendor,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: navigator.deviceMemory,
          
          // Informations sur l'écran
          screen: {
            width: window.screen.width,
            height: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            colorDepth: window.screen.colorDepth,
            pixelDepth: window.screen.pixelDepth,
            orientation: window.screen.orientation ? {
              type: window.screen.orientation.type,
              angle: window.screen.orientation.angle
            } : null,
            devicePixelRatio: window.devicePixelRatio
          },
          
          // Informations sur les performances
          performance: {
            now: performance.now(),
            timing: performance.timing ? { ...performance.timing } : null,
            memory: performance.memory ? {
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              usedJSHeapSize: performance.memory.usedJSHeapSize
            } : null
          },
          
          // Informations sur la connexion
          connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
          } : null,
          
          // Informations sur la batterie
          battery: null, // Sera rempli si disponible
          
          // Valeurs aléatoires cryptographiques
          cryptoRandom: Array.from(crypto.getRandomValues(new Uint8Array(64))),
          
          // Horodatage
          timestamp: {
            date: Date.now(),
            iso: new Date().toISOString(),
            timezone: new Date().getTimezoneOffset()
          }
        };
        
        // Essayer d'obtenir les informations sur la batterie si disponibles
        if (navigator.getBattery) {
          try {
            const battery = await navigator.getBattery();
            systemInfo.battery = {
              charging: battery.charging,
              chargingTime: battery.chargingTime,
              dischargingTime: battery.dischargingTime,
              level: battery.level
            };
          } catch (e) {
            // Ignorer les erreurs
          }
        }
        
        // Convertir les données en chaîne JSON puis en tableau d'octets
        const jsonString = JSON.stringify(systemInfo);
        const encoder = new TextEncoder();
        const byteArray = encoder.encode(jsonString);
        
        // Incorporer dans le pool d'entropie
        this._incorporateData(byteArray, "systemInfo");
        
        this._updateProgress(65, "Informations système collectées");
        
      } catch (error) {
        console.warn("Impossible de collecter toutes les informations système:", error);
        // Continuer avec d'autres sources
      }
    }
    
    /**
     * Incorpore de nouvelles données dans le pool d'entropie
     * @param {Uint8Array} data Les données à incorporer
     * @param {string} source Nom de la source d'entropie
     * @private
     */
    _incorporateData(data, source) {
      if (!this.entropyPool) return;
      
      // Calculer un hachage SHA-256 des données
      crypto.subtle.digest('SHA-256', data)
        .then(hashBuffer => {
          const hashArray = new Uint8Array(hashBuffer);
          
          // Mélanger les données dans le pool d'entropie
          // en utilisant une opération XOR avec rotation
          for (let i = 0; i < hashArray.length; i++) {
            const poolIndex = (i * 7) % this.entropyPool.length; // Distribution non linéaire
            this.entropyPool[poolIndex] ^= hashArray[i];
          }
          
          // Stocker le résultat pour analyse
          this.sourceResults[source] = {
            bytes: data.length,
            hash: Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
          };
          
          // Estimer l'entropie ajoutée (estimation conservatrice)
          const estimatedBits = Math.min(data.length, 256) / 4; // Maximum 64 bits par source
          this.entropyCollected += estimatedBits;
          
          console.log(`Entropie collectée de ${source}: ~${estimatedBits.toFixed(1)} bits (estimation)`);
        })
        .catch(error => {
          console.warn(`Erreur lors de l'incorporation des données de ${source}:`, error);
        });
    }
    
    /**
     * Finalise le pool d'entropie et génère la clé finale
     * @returns {Promise<Uint8Array>} Entropie finale
     * @private
     */
    async _finalizeEntropyPool() {
      // Ajouter une dernière source d'entropie (timing actuel)
      const finalTimestamp = new Uint8Array(8);
      const dataView = new DataView(finalTimestamp.buffer);
      dataView.setFloat64(0, performance.now(), false);
      
      // Incorporer ce timing dans le pool
      this._incorporateData(finalTimestamp, "finalTiming");
      
      // Attendre un court instant pour permettre l'incorporation finale
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Générer la clé finale à partir du pool complet
      const entropyBuffer = await crypto.subtle.digest('SHA-512', this.entropyPool);
      const finalEntropy = new Uint8Array(entropyBuffer);
      
      return finalEntropy;
    }
    
    /**
     * Met à jour la progression et notifie le callback
     * @param {number} percent Pourcentage de progression (0-100)
     * @param {string} status Message d'état
     * @private
     */
    _updateProgress(percent, status) {
      if (this.config.onProgress) {
        this.config.onProgress(percent, status);
      }
    }
    
    /**
     * Obtient un hexadécimal formaté de l'entropie finale
     * @param {Uint8Array} entropyArray Tableau d'entropie
     * @returns {string} Représentation hexadécimale
     */
    static formatAsHex(entropyArray) {
      return Array.from(entropyArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    
    /**
     * Dérive une clé cryptographique à partir de l'entropie et d'une phrase de passe
     * @param {Uint8Array} entropy Entropie brute
     * @param {string} passphrase Phrase de passe (optionnelle)
     * @param {number} keyLengthBits Longueur de la clé en bits (par défaut 256)
     * @returns {Promise<string>} Clé cryptographique en format hexadécimal
     */
    static async deriveKey(entropy, passphrase = "", keyLengthBits = 256) {
      // Convertir la passphrase en tableau d'octets
      const encoder = new TextEncoder();
      const passphraseData = encoder.encode(passphrase);
      
      // Combiner l'entropie et la passphrase
      const combinedData = new Uint8Array(entropy.length + passphraseData.length);
      combinedData.set(entropy);
      combinedData.set(passphraseData, entropy.length);
      
      // Créer un sel à partir des premiers octets de l'entropie
      const salt = entropy.slice(0, 16);
      
      // Nombre d'octets de clé à générer
      const keyLengthBytes = Math.ceil(keyLengthBits / 8);
      
      try {
        // Utiliser PBKDF2 pour dériver une clé sécurisée
        // Note: Utilisation de SHA-256 comme fonction de hachage
        const keyMaterial = await crypto.subtle.importKey(
          "raw",
          combinedData,
          { name: "PBKDF2" },
          false,
          ["deriveBits"]
        );
        
        const derivedBits = await crypto.subtle.deriveBits(
          {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000, // Nombre élevé d'itérations pour résistance aux attaques par force brute
            hash: "SHA-256"
          },
          keyMaterial,
          keyLengthBits
        );
        
        // Convertir les bits dérivés en tableau d'octets
        const derivedKey = new Uint8Array(derivedBits);
        
        // Convertir en format hexadécimal
        return Array.from(derivedKey)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } catch (error) {
        // Fallback si PBKDF2 n'est pas disponible
        console.warn("PBKDF2 non disponible, utilisation du mode fallback:", error);
        
        // Utiliser SHA-512 en mode fallback
        const hashBuffer = await crypto.subtle.digest("SHA-512", combinedData);
        const hashArray = new Uint8Array(hashBuffer);
        
        // Si on veut une clé plus courte, tronquer
        const resultKey = hashArray.slice(0, keyLengthBytes);
        
        // Convertir en format hexadécimal
        return Array.from(resultKey)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }
    }
    
    /**
     * Génère un identificateur unique basé sur l'entropie
     * @param {Uint8Array} entropy Entropie brute
     * @returns {string} Identifiant unique
     */
    static generateUniqueId(entropy) {
      // Utiliser les 16 premiers octets de l'entropie pour créer un UUID-like
      const bytes = entropy.slice(0, 16);
      
      // Formater comme un UUID
      return [
        bytes.slice(0, 4),
        bytes.slice(4, 6),
        bytes.slice(6, 8),
        bytes.slice(8, 10),
        bytes.slice(10, 16)
      ].map(chunk => 
        Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join('')
      ).join('-');
    }
  }
// APRÈS (exportation nommée) :
export { EntropyCollector };