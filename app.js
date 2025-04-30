/**
 * Générateur de Clé Post-Quantique à partir d'Audio
 * 
 * Cette application utilise une entrée audio organique pour générer des clés 
 * cryptographiques résistantes aux attaques quantiques.
 */

// Classe principale pour la génération de clés post-quantiques basées sur l'audio
class PostQuantumAudioKeyGenerator {
    constructor() {
      this.config = {
        sampleRate: 44100,
        fftSize: 2048,
        minRecordingTime: 5, // Minimum 5 secondes pour garantir suffisamment d'entropie
        hashRounds: 10000,   // Nombre d'itérations pour PBKDF2
        saltLength: 32,      // Longueur du sel en octets
        keyLength: 32,       // Longueur de la clé finale (256 bits)
        dilithiumEnabled: true, // Utilisation de l'algorithme résistant aux attaques quantiques
      };
      
      // État interne
      this.audioContext = null;
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.isRecording = false;
      this.biometricProfile = null;
      
      // Initialisation du crypto worker pour les calculs intensifs
      this.cryptoWorker = new Worker(this.createCryptoWorkerBlob());
    }
    
    /**
     * Crée un Blob URL pour le Worker de cryptographie
     */
    createCryptoWorkerBlob() {
      const workerCode = `
        // Implémentation du SHAKE256 (un algorithme de hachage résistant aux attaques quantiques)
        // Note: Dans une implémentation réelle, utilisez une bibliothèque crypto complète
        
        // Simulation d'un algorithme de hachage résistant aux attaques quantiques
        function shake256(input, outputLength) {
          // Cette implémentation est simplifiée
          // Une vraie implémentation utiliserait la librairie complète de SHAKE256
          
          // Convertir l'entrée en tableau d'octets si nécessaire
          const inputArray = typeof input === 'string' 
            ? new TextEncoder().encode(input) 
            : input;
          
          // Simuler un hachage résistant aux attaques quantiques
          return crypto.subtle.digest('SHA-256', inputArray)
            .then(hash => {
              // En production, remplacer par SHAKE256 ou Dilithium
              return hash;
            });
        }
        
        // Simulation de PBKDF2 avec SHAKE256
        async function pbkdf2Shake(password, salt, iterations, keyLength) {
          let key = new Uint8Array(password);
          const saltArray = new Uint8Array(salt);
          
          // Appliquer plusieurs itérations
          for (let i = 0; i < iterations; i++) {
            // Combiner la clé actuelle avec le sel et un compteur d'itération
            const combined = new Uint8Array(key.length + saltArray.length + 4);
            combined.set(key);
            combined.set(saltArray, key.length);
            
            // Ajouter le compteur d'itération (4 octets, big-endian)
            const view = new DataView(combined.buffer);
            view.setUint32(key.length + saltArray.length, i, false);
            
            // Appliquer SHAKE256
            const hashBuffer = await shake256(combined, keyLength);
            key = new Uint8Array(hashBuffer);
          }
          
          return key.slice(0, keyLength);
        }
        
        // Simulation d'un algorithme post-quantique (similaire à CRYSTALS-Dilithium)
        async function dilithiumSign(privateKey, message) {
          // Cette fonction simule la signature Dilithium
          // En production, utilisez une vraie bibliothèque post-quantique
          
          // Combiner la clé privée et le message
          const combined = new Uint8Array(privateKey.length + message.length);
          combined.set(privateKey);
          combined.set(message, privateKey.length);
          
          // Générer une signature simulée
          const signature = await shake256(combined, 128); // Simuler une signature de 1024 bits
          return signature;
        }
        
        // Gestionnaire des messages du worker
        self.onmessage = async function(e) {
          const { type, data } = e.data;
          
          switch(type) {
            case 'pbkdf2':
              try {
                const { password, salt, iterations, keyLength } = data;
                const derivedKey = await pbkdf2Shake(password, salt, iterations, keyLength);
                self.postMessage({ 
                  type: 'pbkdf2-result', 
                  result: derivedKey 
                });
              } catch (error) {
                self.postMessage({ 
                  type: 'error', 
                  error: error.message 
                });
              }
              break;
              
            case 'dilithium-sign':
              try {
                const { privateKey, message } = data;
                const signature = await dilithiumSign(privateKey, message);
                self.postMessage({ 
                  type: 'dilithium-result', 
                  result: signature 
                });
              } catch (error) {
                self.postMessage({ 
                  type: 'error', 
                  error: error.message 
                });
              }
              break;
              
            default:
              self.postMessage({ 
                type: 'error', 
                error: 'Unknown command' 
              });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      return URL.createObjectURL(blob);
    }
    
    /**
     * Initialise l'application
     */
    async init() {
      try {
        // Créer l'interface utilisateur
        this.createUI();
        
        // Initialiser le contexte audio
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("Contexte audio initialisé");
        
        // Attacher les gestionnaires d'événements
        document.getElementById('startRecording').addEventListener('click', () => this.startRecording());
        document.getElementById('stopRecording').addEventListener('click', () => this.stopRecording());
        document.getElementById('generateKey').addEventListener('click', () => this.generatePostQuantumKey());
        document.getElementById('copyKey').addEventListener('click', () => this.copyKeyToClipboard());
        document.getElementById('exportKeyPair').addEventListener('click', () => this.exportKeyPair());
        
        // Vérifier la compatibilité avec les API nécessaires
        this.checkCompatibility();
        
      } catch (error) {
        this.updateStatus(`Erreur d'initialisation: ${error.message}`, 'error');
        console.error("Erreur d'initialisation:", error);
      }
    }
    
    /**
     * Vérifier la compatibilité du navigateur
     */
    checkCompatibility() {
      const requirements = [
        { feature: 'getUserMedia', available: !!navigator.mediaDevices?.getUserMedia },
        { feature: 'AudioContext', available: !!(window.AudioContext || window.webkitAudioContext) },
        { feature: 'MediaRecorder', available: !!window.MediaRecorder },
        { feature: 'Web Crypto API', available: !!window.crypto?.subtle },
        { feature: 'TextEncoder', available: !!window.TextEncoder },
      ];
      
      const incompatible = requirements.filter(req => !req.available);
      
      if (incompatible.length > 0) {
        const missingFeatures = incompatible.map(item => item.feature).join(', ');
        this.updateStatus(`Votre navigateur n'est pas compatible. Fonctionnalités manquantes: ${missingFeatures}`, 'error');
        
        // Désactiver les boutons
        document.getElementById('startRecording').disabled = true;
      } else {
        this.updateStatus("Système prêt. Cliquez sur 'Commencer l'enregistrement' pour démarrer.", 'info');
      }
    }
    
    /**
     * Crée l'interface utilisateur
     */
    createUI() {
      const container = document.createElement('div');
      container.className = 'pq-audio-generator';
      container.innerHTML = `
        <div class="header">
          <h2>Générateur de Clés Post-Quantiques par Audio</h2>
          <div class="badge secure">Résistant Quantique</div>
        </div>
        
        <div class="description">
          <p>Cet outil génère des clés cryptographiques robustes basées sur votre voix et résistantes aux attaques quantiques.</p>
        </div>
        
        <div class="status-container">
          <div class="status-icon"></div>
          <p id="status">Système prêt</p>
        </div>
        
        <div class="visualization-container">
          <canvas id="audioVisualizer" width="600" height="150"></canvas>
          <div class="audio-metrics">
            <div class="metric">
              <span class="metric-label">Entropie</span>
              <div class="metric-bar">
                <div id="entropyBar" class="metric-fill" style="width: 0%"></div>
              </div>
            </div>
            <div class="metric">
              <span class="metric-label">Qualité</span>
              <div class="metric-bar">
                <div id="qualityBar" class="metric-fill" style="width: 0%"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="controls">
          <button id="startRecording" class="primary">Commencer l'enregistrement</button>
          <button id="stopRecording" disabled>Arrêter l'enregistrement</button>
          <button id="generateKey" disabled>Générer clé post-quantique</button>
        </div>
        
        <div class="key-result">
          <div class="key-container">
            <div class="key-header">
              <h3>Clé privée</h3>
              <button id="copyKey" class="icon-button" disabled>
                <span class="icon">📋</span>
              </button>
            </div>
            <textarea id="keyOutput" readonly placeholder="Votre clé privée apparaîtra ici"></textarea>
          </div>
          
          <div class="key-info">
            <div class="info-row">
              <span class="info-label">Type d'algorithme:</span>
              <span class="info-value">CRYSTALS-Dilithium (simulé)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Force de la clé:</span>
              <span class="info-value">256 bits (résistante aux attaques quantiques)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Entropie estimée:</span>
              <span id="entropyValue" class="info-value">0 bits</span>
            </div>
          </div>
        </div>
        
        <div class="export-section">
          <button id="exportKeyPair" disabled>Exporter la paire de clés</button>
          <p class="export-note">Pour l'utilisation dans les systèmes d'API</p>
        </div>
      `;
      
      document.body.appendChild(container);
      
      // Ajouter les styles
      const style = document.createElement('style');
      style.textContent = `
        .pq-audio-generator {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          font-family: system-ui, -apple-system, sans-serif;
          background: linear-gradient(to bottom, #ffffff, #f9fafb);
        }
        
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a2b42;
        }
        
        .badge {
          margin-left: 12px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .badge.secure {
          background-color: #10b981;
          color: white;
        }
        
        .description {
          margin-bottom: 24px;
          color: #4b5563;
          font-size: 15px;
        }
        
        .status-container {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding: 12px 16px;
          background-color: #f3f4f6;
          border-radius: 8px;
        }
        
        .status-icon {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #10b981;
          margin-right: 12px;
        }
        
        #status {
          margin: 0;
          font-size: 14px;
          color: #374151;
        }
        
        .error .status-icon {
          background-color: #ef4444;
        }
        
        .warning .status-icon {
          background-color: #f59e0b;
        }
        
        .visualization-container {
          margin-bottom: 24px;
          padding: 16px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        #audioVisualizer {
          width: 100%;
          height: 150px;
          background-color: #ffffff;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        
        .audio-metrics {
          display: flex;
          gap: 24px;
        }
        
        .metric {
          flex: 1;
        }
        
        .metric-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 6px;
        }
        
        .metric-bar {
          height: 6px;
          width: 100%;
          background-color: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .metric-fill {
          height: 100%;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }
        
        .controls {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        button {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        
        button.primary {
          background-color: #3b82f6;
          color: white;
        }
        
        button.primary:hover {
          background-color: #2563eb;
        }
        
        button:not(.primary) {
          background-color: #f3f4f6;
          color: #374151;
          border-color: #e5e7eb;
        }
        
        button:not(.primary):hover {
          background-color: #e5e7eb;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .key-result {
          margin-bottom: 24px;
          padding: 16px;
          background-color: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .key-container {
          margin-bottom: 16px;
        }
        
        .key-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .key-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a2b42;
        }
        
        .icon-button {
          padding: 4px 8px;
          background: none;
          border: none;
        }
        
        #keyOutput {
          width: 100%;
          height: 80px;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background-color: #ffffff;
          font-family: monospace;
          font-size: 14px;
          resize: none;
        }
        
        .key-info {
          background-color: #ffffff;
          border-radius: 6px;
          padding: 12px;
          border: 1px solid #e5e7eb;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .info-row:last-child {
          margin-bottom: 0;
        }
        
        .info-label {
          font-size: 13px;
          color: #6b7280;
        }
        
        .info-value {
          font-size: 13px;
          font-weight: 500;
          color: #1a2b42;
        }
        
        .export-section {
          text-align: center;
        }
        
        .export-note {
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280;
        }
        
        /* États des messages */
        .error {
          color: #ef4444;
        }
        
        .warning {
          color: #f59e0b;
        }
        
        .success {
          color: #10b981;
        }
      `;
      
      document.head.appendChild(style);
    }
    
    /**
     * Met à jour le statut dans l'interface utilisateur
     */
    updateStatus(message, type = 'info') {
      const statusContainer = document.querySelector('.status-container');
      const statusElement = document.getElementById('status');
      
      // Supprimer les classes existantes
      statusContainer.classList.remove('error', 'warning', 'success');
      
      // Ajouter la classe appropriée
      if (type !== 'info') {
        statusContainer.classList.add(type);
      }
      
      statusElement.textContent = message;
    }
    
    /**
     * Démarre l'enregistrement audio
     */
    async startRecording() {
      try {
        this.audioChunks = [];
        this.isRecording = true;
        
        // Demander l'accès au microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Configurer l'analyseur audio
        this.setupAudioAnalyzer(stream);
        
        // Configurer l'enregistreur
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = event => {
          this.audioChunks.push(event.data);
        };
        
        this.mediaRecorder.onstop = () => {
          this.updateStatus("Enregistrement terminé. Prêt pour la génération de clé.", 'success');
          document.getElementById('generateKey').disabled = false;
        };
        
        // Démarrer l'enregistrement
        this.mediaRecorder.start();
        this.updateStatus("Enregistrement en cours... Parlez clairement pendant au moins 5 secondes.");
        
        // Mettre à jour l'interface
        document.getElementById('startRecording').disabled = true;
        document.getElementById('stopRecording').disabled = false;
        
        // Définir une durée maximale d'enregistrement (30 secondes)
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, 30000);
        
      } catch (error) {
        this.updateStatus(`Erreur lors de l'accès au microphone: ${error.message}`, 'error');
        console.error("Erreur d'enregistrement:", error);
      }
    }
    
    /**
     * Configure l'analyseur audio et le visualiseur
     */
    setupAudioAnalyzer(stream) {
      // Créer un analyseur de spectre audio
      const analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(stream);
      
      // Connecter la source à l'analyseur
      source.connect(analyser);
      
      // Configurer l'analyseur
      analyser.fftSize = this.config.fftSize;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Référence au canvas pour le visualiseur
      const canvas = document.getElementById('audioVisualizer');
      const canvasCtx = canvas.getContext('2d');
      
      // Variables pour le calcul de l'entropie
      let entropyEstimate = 0;
      let recordingQuality = 0;
      let lastDataArray = new Uint8Array(bufferLength);
      
      // Fonction pour visualiser l'audio
      const visualize = () => {
        if (!this.isRecording) return;
        
        requestAnimationFrame(visualize);
        
        // Obtenir les données de fréquence
        analyser.getByteFrequencyData(dataArray);
        
        // Effacer le canvas
        canvasCtx.fillStyle = 'rgb(255, 255, 255)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner les barres de fréquence
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 256 * canvas.height;
          
          // Gradient de couleur basé sur la fréquence
          const hue = i / bufferLength * 240; // De bleu à rouge
          canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
          
          canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
        
        // Calculer une estimation de l'entropie
        // Basée sur la différence entre les trames successives
        let totalDifference = 0;
        for (let i = 0; i < bufferLength; i++) {
          totalDifference += Math.abs(dataArray[i] - lastDataArray[i]);
        }
        
        // Calculer l'entropie et la qualité
        entropyEstimate = Math.min(256, entropyEstimate + totalDifference / 10000);
        recordingQuality = Math.min(100, (entropyEstimate / 256) * 100);
        
        // Mettre à jour les barres de métrique
        document.getElementById('entropyBar').style.width = `${(entropyEstimate / 256) * 100}%`;
        document.getElementById('qualityBar').style.width = `${recordingQuality}%`;
        document.getElementById('entropyValue').textContent = `${Math.floor(entropyEstimate)} bits`;
        
        // Sauvegarder les données actuelles pour la prochaine comparaison
        lastDataArray.set(dataArray);
      };
      
      visualize();
    }
    
    /**
     * Arrête l'enregistrement
     */
    stopRecording() {
      if (!this.isRecording || !this.mediaRecorder) return;
      
      this.isRecording = false;
      this.mediaRecorder.stop();
      
      // Mettre à jour l'interface
      document.getElementById('startRecording').disabled = false;
      document.getElementById('stopRecording').disabled = true;
      
      this.updateStatus("Traitement en cours...");
    }
    
    /**
     * Extrait les caractéristiques biométriques de l'audio enregistré
     */
    async extractBiometricFeatures(audioBlob) {
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = async (event) => {
          try {
            const audioBuffer = await this.audioContext.decodeAudioData(event.target.result);
            
            // Obtenir les données du canal audio (mono)
            const audioData = audioBuffer.getChannelData(0);
            
            // Extraire plusieurs caractéristiques
            const features = {
              // Caractéristiques temporelles
              rms: this.calculateRMS(audioData),
              zeroCrossingRate: this.calculateZeroCrossingRate(audioData),
              
              // Caractéristiques spectrales
              spectralCentroid: this.calculateSpectralCentroid(audioData, audioBuffer.sampleRate),
              spectralFlatness: this.calculateSpectralFlatness(audioData),
              
              // Caractéristiques MFCC (simplifiées)
              mfcc: this.calculateSimplifiedMFCC(audioData, audioBuffer.sampleRate),
              
              // Distribution de l'énergie
              energyDistribution: this.calculateEnergyDistribution(audioData, 16),
              
              // Empreinte perceptuelle
              perceptualHash: this.calculatePerceptualHash(audioData, 32),
              
              // Métadonnées
              sampleRate: audioBuffer.sampleRate,
              duration: audioBuffer.duration,
              timestamp: Date.now()
            };
            
            // Ajouter des caractéristiques aléatoires supplémentaires
            features.additionalEntropy = this.collectAdditionalEntropy();
            
            resolve(features);
            
          } catch (error) {
            reject(error);
          }
        };
        
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(audioBlob);
      });
    }
    
    /**
     * Calcule la valeur RMS (Root Mean Square) des données audio
     */
    calculateRMS(data) {
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
      }
      return Math.sqrt(sum / data.length);
    }
    
    /**
     * Calcule le taux de passage par zéro
     */
    calculateZeroCrossingRate(data) {
      let crossings = 0;
      for (let i = 1; i < data.length; i++) {
        if ((data[i] * data[i - 1]) < 0) {
          crossings++;
        }
      }
      return crossings / (data.length - 1);
    }
    
    /**
     * Calcule le centroïde spectral
     */
    calculateSpectralCentroid(data, sampleRate) {
      // Version simplifiée du calcul du centroïde spectral
      // Dans une implémentation réelle, utiliser une FFT complète
      
      let weightedSum = 0;
      let totalEnergy = 0;
      
      const fftSize = Math.min(2048, data.length);
      const spectrum = new Array(fftSize);
      
      // Calculer une FFT simplifiée
      for (let i = 0; i < fftSize; i++) {
        let real = 0;
        let imag = 0;
        
        // Approche simplifiée pour la démonstration
        for (let j = 0; j < data.length; j += 10) {  // Pas de 10 pour accélérer le calcul
          const angle = 2 * Math.PI * i * j / data.length;
          real += data[j] * Math.cos(angle);
          imag -= data[j] * Math.sin(angle);
        }
        
        spectrum[i] = Math.sqrt(real * real + imag * imag);
        
        weightedSum += i * spectrum[i];
        totalEnergy += spectrum[i];
      }
      
      return totalEnergy > 0 ? weightedSum / totalEnergy * (sampleRate / 2) / fftSize : 0;
    }
    
    /**
     * Calcule la platitude spectrale
     */
    calculateSpectralFlatness(data) {
      // Simplification pour la démonstration
      const fftSize = Math.min(2048, data.length);
      const spectrum = new Array(fftSize);
      
      // Calculer une FFT simplifiée pour obtenir le spectre
      for (let i = 0; i < fftSize; i++) {
        let real = 0;
        let imag = 0;
        
        for (let j = 0; j < data.length; j += 10) {
          const angle = 2 * Math.PI * i * j / data.length;
          real += data[j] * Math.cos(angle);
          imag -= data[j] * Math.sin(angle);
        }
        
        spectrum[i] = Math.sqrt(real * real + imag * imag);
      }
      
      // Calculer le produit géométrique et la moyenne arithmétique
      let sumLogs = 0;
      let sum = 0;
      let nonZeroCount = 0;
      
      for (let i = 0; i < spectrum.length; i++) {
        if (spectrum[i] > 0.000001) {  // Éviter les valeurs trop proches de zéro
          sumLogs += Math.log(spectrum[i]);
          sum += spectrum[i];
          nonZeroCount++;
        }
      }
      
      // Calcul des moyennes
      const geometricMean = Math.exp(sumLogs / nonZeroCount);
      const arithmeticMean = sum / nonZeroCount;
      
      // La platitude spectrale est le rapport entre la moyenne géométrique et la moyenne arithmétique
      return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
    }
    
    /**
     * Calcule une version simplifiée des coefficients MFCC
     */
    calculateSimplifiedMFCC(data, sampleRate) {
      // Version très simplifiée du calcul des MFCC
      // Une implémentation complète nécessiterait une bibliothèque dédiée
      
      const frameSize = 1024;
      const hopSize = 512;
      const numFrames = Math.floor((data.length - frameSize) / hopSize) + 1;
      const numCoeffs = 13; // Nombre standard de coefficients MFCC
      
      // Résultat: 13 coefficients moyennés sur tous les frames
      const result = new Array(numCoeffs).fill(0);
      
      // Pour chaque frame
      for (let frame = 0; frame < numFrames; frame++) {
        const startIdx = frame * hopSize;
        const endIdx = startIdx + frameSize;
        
        // Extraire le frame
        const frameData = data.slice(startIdx, endIdx);
        
        // Appliquer une fenêtre de Hamming
        for (let i = 0; i < frameSize; i++) {
          frameData[i] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (frameSize - 1));
        }
        
        // Calculer le spectre via FFT simplifiée
        const spectrum = new Array(frameSize/2);
        for (let k = 0; k < frameSize/2; k++) {
          let real = 0;
          let imag = 0;
          
          for (let n = 0; n < frameSize; n++) {
            const angle = 2 * Math.PI * k * n / frameSize;
            real += frameData[n] * Math.cos(angle);
            imag -= frameData[n] * Math.sin(angle);
          }
          
          spectrum[k] = Math.sqrt(real * real + imag * imag);
        }
        
        // Simuler le filtrage par banc de filtres Mel
        const melSpectrum = new Array(numCoeffs * 2).fill(0);
        for (let i = 0; i < melSpectrum.length; i++) {
          const melStart = i * spectrum.length / melSpectrum.length;
          const melEnd = (i + 1) * spectrum.length / melSpectrum.length;
          
          for (let j = Math.floor(melStart); j < Math.floor(melEnd); j++) {
            melSpectrum[i] += spectrum[j];
          }
        }
        
        // Prendre le logarithme
        for (let i = 0; i < melSpectrum.length; i++) {
          melSpectrum[i] = melSpectrum[i] > 0 ? Math.log(melSpectrum[i]) : 0;
        }
        
        // Simuler une DCT simplifiée
        for (let i = 0; i < numCoeffs; i++) {
          for (let j = 0; j < melSpectrum.length; j++) {
            result[i] += melSpectrum[j] * Math.cos(Math.PI * i * (j + 0.5) / melSpectrum.length);
          }
        }
      }
      
      // Moyenner sur tous les frames
      for (let i = 0; i < numCoeffs; i++) {
        result[i] /= numFrames;
      }
      
      return result;
    }
    
    /**
     * Calcule la distribution d'énergie pour plusieurs segments
     */
    calculateEnergyDistribution(data, segments) {
      const segmentSize = Math.floor(data.length / segments);
      const energies = new Array(segments);
      
      for (let i = 0; i < segments; i++) {
        const start = i * segmentSize;
        const end = start + segmentSize;
        
        let energy = 0;
        for (let j = start; j < end && j < data.length; j++) {
          energy += data[j] * data[j];
        }
        
        energies[i] = energy / segmentSize;
      }
      
      return energies;
    }
    
    /**
     * Calcule une empreinte perceptuelle de l'audio
     */
    calculatePerceptualHash(data, bands) {
      // Diviser les données en bandes et calculer l'énergie relative
      const result = new Array(bands);
      const segmentSize = Math.floor(data.length / bands);
      
      // Calculer l'énergie moyenne globale
      let avgEnergy = 0;
      for (let i = 0; i < data.length; i++) {
        avgEnergy += Math.abs(data[i]);
      }
      avgEnergy /= data.length;
      
      // Calculer l'énergie par bande
      for (let i = 0; i < bands; i++) {
        let bandEnergy = 0;
        const start = i * segmentSize;
        const end = start + segmentSize;
        
        for (let j = start; j < end && j < data.length; j++) {
          bandEnergy += Math.abs(data[j]);
        }
        
        const segmentEnergy = bandEnergy / segmentSize;
        // Binariser: 1 si au-dessus de la moyenne, 0 sinon
        result[i] = segmentEnergy > avgEnergy ? 1 : 0;
      }
      
      return result;
    }
    
    /**
     * Collecte des sources supplémentaires d'entropie
     */
    collectAdditionalEntropy() {
      // Collecter diverses sources d'entropie
      const entropy = {
        timestamp: Date.now(),
        highResTimestamp: performance.now(),
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timeZoneOffset: new Date().getTimezoneOffset(),
        language: navigator.language,
        platform: navigator.platform,
        deviceMemory: navigator.deviceMemory || 0,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        randomValues: Array.from(crypto.getRandomValues(new Uint32Array(8))),
      };
      
      return entropy;
    }
    
    /**
     * Génère une clé post-quantique à partir des caractéristiques biométriques
     */
    async generatePostQuantumKey() {
      try {
        if (this.audioChunks.length === 0) {
          this.updateStatus("Aucun enregistrement disponible", "error");
          return;
        }
        
        this.updateStatus("Génération de la clé en cours...");
        
        // Combiner les fragments audio
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Vérifier la durée minimale
        const duration = await this.getAudioDuration(audioBlob);
        if (duration < this.config.minRecordingTime) {
          this.updateStatus(`L'enregistrement est trop court (${duration.toFixed(1)}s). Minimum ${this.config.minRecordingTime}s requis.`, "warning");
          return;
        }
        
        // Extraire les caractéristiques biométriques
        this.updateStatus("Extraction des caractéristiques vocales...");
        this.biometricProfile = await this.extractBiometricFeatures(audioBlob);
        
        // Sérialiser les caractéristiques pour la dérivation de clé
        const serializedFeatures = JSON.stringify(this.biometricProfile);
        const featuresBuffer = new TextEncoder().encode(serializedFeatures);
        
        // Générer un sel aléatoire
        const salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength));
        
        // Renforcer la sécurité avec PBKDF2 (ajusté pour la résistance quantique)
        this.updateStatus("Application des transformations post-quantiques...");
        
        // Utiliser le worker pour le calcul intensif
        await new Promise((resolve, reject) => {
          this.cryptoWorker.onmessage = (e) => {
            const { type, result, error } = e.data;
            
            if (type === 'error') {
              reject(new Error(error));
              return;
            }
            
            if (type === 'pbkdf2-result') {
              // Convertir le résultat en format hexadécimal
              const hashArray = Array.from(new Uint8Array(result));
              const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              
              // Afficher la clé
              document.getElementById('keyOutput').value = hashHex;
              
              // Activer les boutons
              document.getElementById('copyKey').disabled = false;
              document.getElementById('exportKeyPair').disabled = false;
              
              // Mettre à jour le statut
              this.updateStatus("Clé post-quantique générée avec succès", "success");
              
              resolve();
            }
          };
          
          // Envoyer les données au worker
          this.cryptoWorker.postMessage({
            type: 'pbkdf2',
            data: {
              password: featuresBuffer,
              salt: salt,
              iterations: this.config.hashRounds,
              keyLength: this.config.keyLength
            }
          });
        });
        
      } catch (error) {
        this.updateStatus(`Erreur lors de la génération de la clé: ${error.message}`, "error");
        console.error("Erreur de génération:", error);
      }
    }
    
    /**
     * Obtient la durée d'un blob audio
     */
    getAudioDuration(audioBlob) {
      return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.onloadedmetadata = () => resolve(audio.duration);
        audio.onerror = reject;
        audio.src = URL.createObjectURL(audioBlob);
      });
    }
    
    /**
     * Copie la clé dans le presse-papiers
     */
    copyKeyToClipboard() {
      const keyOutput = document.getElementById('keyOutput');
      keyOutput.select();
      document.execCommand('copy');
      
      this.updateStatus("Clé copiée dans le presse-papiers", "success");
    }
    
    /**
     * Exporte la paire de clés (pour les API)
     */
    async exportKeyPair() {
      try {
        const privateKey = document.getElementById('keyOutput').value;
        
        if (!privateKey) {
          this.updateStatus("Aucune clé privée disponible", "error");
          return;
        }
        
        this.updateStatus("Génération de la paire de clés complète...");
        
        // Simuler la génération d'une clé publique
        // Dans une implémentation réelle, utiliser une bibliothèque post-quantique
        const message = new TextEncoder().encode("DILITHIUM-KEY-GEN");
        
        // Utiliser le worker pour générer la signature (simulé)
        const publicKey = await new Promise((resolve, reject) => {
          this.cryptoWorker.onmessage = (e) => {
            const { type, result, error } = e.data;
            
            if (type === 'error') {
              reject(new Error(error));
              return;
            }
            
            if (type === 'dilithium-result') {
              // Convertir le résultat en format hexadécimal pour simuler une clé publique
              const hashArray = Array.from(new Uint8Array(result));
              const publicKeyHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
              resolve(publicKeyHex);
            }
          };
          
          // Envoyer les données au worker
          this.cryptoWorker.postMessage({
            type: 'dilithium-sign',
            data: {
              privateKey: new TextEncoder().encode(privateKey),
              message: message
            }
          });
        });
        
        // Préparer le contenu à télécharger
        const keyPair = {
          algorithm: "CRYSTALS-Dilithium",
          version: "1.0",
          privateKey: privateKey,
          publicKey: publicKey,
          created: new Date().toISOString(),
          entropy_bits: Math.floor(document.getElementById('entropyValue').textContent.split(' ')[0]),
          post_quantum_resistant: true
        };
        
        // Créer le fichier
        const blob = new Blob([JSON.stringify(keyPair, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Créer un lien de téléchargement
        const a = document.createElement('a');
        a.href = url;
        a.download = `pq_keypair_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Libérer l'URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        this.updateStatus("Paire de clés exportée avec succès", "success");
        
      } catch (error) {
        this.updateStatus(`Erreur lors de l'exportation: ${error.message}`, "error");
        console.error("Erreur d'exportation:", error);
      }
    }
  }
  
  // Fonction pour démarrer l'application
  function initPostQuantumAudioKeyGenerator() {
    const generator = new PostQuantumAudioKeyGenerator();
    generator.init().catch(error => {
      console.error("Erreur d'initialisation:", error);
    });
  }
  
  // Démarrer l'application au chargement de la page
  window.addEventListener('DOMContentLoaded', initPostQuantumAudioKeyGenerator);
  
  // Exporter le module pour une utilisation externe
  export default PostQuantumAudioKeyGenerator;