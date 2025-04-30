/**
 * integration.js
 * 
 * Exemple d'intégration du collecteur d'entropie avancée avec
 * le générateur de clé post-quantique audio existant.
 * 
 * Ce fichier montre comment combiner les deux modules pour créer
 * une solution de génération de clé ultra-sécurisée.
 */

// Importer les modules (adapter les chemins selon votre structure)
import PostQuantumAudioKeyGenerator from './app.js';
import { EntropyCollector } from './EntropyCollector.js';

/**
 * Classe d'intégration qui combine le générateur de clé audio post-quantique
 * avec le collecteur d'entropie avancée
 */
class EnhancedPostQuantumKeyGenerator {
  constructor() {
    // Initialiser le générateur de clé audio post-quantique
    this.audioKeyGenerator = new PostQuantumAudioKeyGenerator();
    
    // Configurer le collecteur d'entropie avec des options adaptées
    this.entropyCollector = new EntropyCollector({
      // Utiliser moins d'échantillons pour une expérience utilisateur plus fluide
      audioSamples: 4096,
      motionSamples: 500,
      timingIterations: 5000,
      
      // Option d'activation des sources (personnalisable)
      useMicrophone: true,
      useMotionSensors: true,
      useTimingJitter: true,
      useNetworkJitter: true,
      useUserInteraction: true, // Interaction utilisateur (peut être désactivée pour une génération automatique)
      
      // Définir l'entropie cible
      targetEntropyBits: 256,
      
      // Callbacks
      onProgress: (percent, status) => {
        // Met à jour l'interface avec la progression de la collecte d'entropie
        this.updateEntropyStatus(percent, status);
      },
      onError: (error) => {
        console.error("Erreur de collecte d'entropie:", error);
        this.audioKeyGenerator.updateStatus("Erreur de collecte d'entropie supplémentaire", "error");
      }
    });
    
    // État interne
    this.enhancedEntropy = null;
    this.isCollectingEntropy = false;
  }
  
  /**
   * Initialise le système combiné
   */
  async init() {
    try {
      // Initialiser le générateur de clé audio post-quantique
      await this.audioKeyGenerator.init();
      
      // Ajouter un bouton supplémentaire pour la collecte d'entropie avancée
      this.addEnhancedEntropyButton();
      
      // Remplacer le gestionnaire du bouton de génération de clé
      this.overrideKeyGenerationButton();
      
      // Ajouter une section d'informations d'entropie
      this.addEntropyInfoSection();
      
    } catch (error) {
      console.error("Erreur d'initialisation:", error);
    }
  }
  
  /**
   * Ajoute un bouton pour la collecte d'entropie avancée
   */
  addEnhancedEntropyButton() {
    // Trouver le conteneur des contrôles
    const controlsContainer = document.querySelector('.controls');
    
    if (!controlsContainer) {
      console.error("Impossible de trouver le conteneur des contrôles");
      return;
    }
    
    // Créer le bouton de collecte d'entropie avancée
    const enhancedEntropyButton = document.createElement('button');
    enhancedEntropyButton.id = 'collectEnhancedEntropy';
    enhancedEntropyButton.textContent = 'Collecter entropie supplémentaire';
    enhancedEntropyButton.className = 'secondary';
    enhancedEntropyButton.disabled = true; // Désactivé par défaut
    
    // Ajouter le bouton au conteneur
    controlsContainer.appendChild(enhancedEntropyButton);
    
    // Ajouter un gestionnaire d'événements
    enhancedEntropyButton.addEventListener('click', () => this.collectEnhancedEntropy());
    
    // Référence au bouton
    this.enhancedEntropyButton = enhancedEntropyButton;
  }
  
  /**
   * Remplace le gestionnaire du bouton de génération de clé
   */
  overrideKeyGenerationButton() {
    const generateKeyButton = document.getElementById('generateKey');
    
    if (!generateKeyButton) {
      console.error("Impossible de trouver le bouton de génération de clé");
      return;
    }
    
    // Stocker la référence à la fonction originale
    this.originalGenerateKey = this.audioKeyGenerator.generatePostQuantumKey.bind(this.audioKeyGenerator);
    
    // Supprimer les gestionnaires d'événements existants
    const oldButton = generateKeyButton.cloneNode(true);
    generateKeyButton.parentNode.replaceChild(oldButton, generateKeyButton);
    
    // Ajouter un nouveau gestionnaire
    oldButton.addEventListener('click', () => this.generateEnhancedKey());
    
    // Activer le bouton d'entropie supplémentaire après l'enregistrement audio
    const stopRecordingButton = document.getElementById('stopRecording');
    if (stopRecordingButton) {
      const originalOnStop = this.audioKeyGenerator.mediaRecorder?.onstop;
      
      // Remplacer le gestionnaire d'événements de fin d'enregistrement
      if (this.audioKeyGenerator.mediaRecorder) {
        this.audioKeyGenerator.mediaRecorder.onstop = () => {
          // Appeler le gestionnaire original
          if (originalOnStop) originalOnStop();
          
          // Activer le bouton d'entropie supplémentaire
          this.enhancedEntropyButton.disabled = false;
        };
      }
    }
  }
  
  /**
   * Ajoute une section d'informations sur l'entropie dans l'interface
   */
  addEntropyInfoSection() {
    // Trouver la section d'information sur la clé
    const keyInfoSection = document.querySelector('.key-info');
    
    if (!keyInfoSection) {
      console.error("Impossible de trouver la section d'information sur la clé");
      return;
    }
    
    // Créer une nouvelle ligne d'information
    const entropyInfoRow = document.createElement('div');
    entropyInfoRow.className = 'info-row';
    entropyInfoRow.innerHTML = `
      <span class="info-label">Sources d'entropie:</span>
      <span id="entropySources" class="info-value">Audio uniquement</span>
    `;
    
    // Ajouter à la section
    keyInfoSection.appendChild(entropyInfoRow);
    
    // Créer une autre ligne pour la qualité d'entropie
    const entropyQualityRow = document.createElement('div');
    entropyQualityRow.className = 'info-row';
    entropyQualityRow.innerHTML = `
      <span class="info-label">Qualité d'entropie:</span>
      <span id="entropyQuality" class="info-value">Standard</span>
    `;
    
    // Ajouter à la section
    keyInfoSection.appendChild(entropyQualityRow);
  }
  
  /**
   * Met à jour le statut de la collecte d'entropie
   */
  updateEntropyStatus(percent, status) {
    // Mettre à jour le statut dans l'interface du générateur audio
    this.audioKeyGenerator.updateStatus(`Entropie supplémentaire: ${status} (${percent.toFixed(0)}%)`, 
      percent < 100 ? "info" : "success");
    
    // Mettre à jour la qualité d'entropie si disponible
    const entropyQualityElement = document.getElementById('entropyQuality');
    if (entropyQualityElement) {
      if (percent < 30) {
        entropyQualityElement.textContent = "Standard";
      } else if (percent < 70) {
        entropyQualityElement.textContent = "Élevée";
      } else {
        entropyQualityElement.textContent = "Maximum";
      }
    }
  }
  
  /**
   * Collecte de l'entropie supplémentaire
   */
  async collectEnhancedEntropy() {
    if (this.isCollectingEntropy) return;
    
    try {
      this.isCollectingEntropy = true;
      
      // Désactiver le bouton pendant la collecte
      this.enhancedEntropyButton.disabled = true;
      
      // Mettre à jour le statut
      this.audioKeyGenerator.updateStatus("Démarrage de la collecte d'entropie supplémentaire...", "info");
      
      // Collecter l'entropie
      this.enhancedEntropy = await this.entropyCollector.collectEntropy();
      
      // Mettre à jour le statut
      this.audioKeyGenerator.updateStatus("Entropie supplémentaire collectée avec succès", "success");
      
      // Mettre à jour l'affichage des sources
      const entropySourcesElement = document.getElementById('entropySources');
      if (entropySourcesElement) {
        entropySourcesElement.textContent = "Audio + Entropie avancée";
      }
      
    } catch (error) {
      console.error("Erreur lors de la collecte d'entropie:", error);
      this.audioKeyGenerator.updateStatus("Erreur lors de la collecte d'entropie supplémentaire", "error");
    } finally {
      this.isCollectingEntropy = false;
      
      // Réactiver le bouton
      this.enhancedEntropyButton.disabled = false;
    }
  }
  
  /**
   * Génère une clé renforcée avec l'entropie supplémentaire
   */
  async generateEnhancedKey() {
    try {
      // Vérifier si l'audio a été enregistré
      if (this.audioKeyGenerator.audioChunks.length === 0) {
        this.audioKeyGenerator.updateStatus("Aucun enregistrement audio disponible", "error");
        return;
      }
      
      // Générer d'abord la clé audio de base
      this.audioKeyGenerator.updateStatus("Extraction des caractéristiques audio...");
      
      // Extraire les caractéristiques biométriques audio
      const audioBlob = new Blob(this.audioKeyGenerator.audioChunks, { type: 'audio/webm' });
      const biometricProfile = await this.audioKeyGenerator.extractBiometricFeatures(audioBlob);
      
      // Sérialiser les caractéristiques
      const serializedFeatures = JSON.stringify(biometricProfile);
      const audioBytesArray = new TextEncoder().encode(serializedFeatures);
      
      // Vérifier si nous avons de l'entropie supplémentaire
      if (this.enhancedEntropy) {
        this.audioKeyGenerator.updateStatus("Combinaison avec l'entropie supplémentaire...");
        
        // Convertir les caractéristiques audio en tableau d'octets
        const combinedEntropy = new Uint8Array(audioBytesArray.length + this.enhancedEntropy.length);
        combinedEntropy.set(audioBytesArray);
        combinedEntropy.set(this.enhancedEntropy, audioBytesArray.length);
        
        // Dériver une clé à partir de l'entropie combinée
        const enhancedKey = await EntropyCollector.deriveKey(combinedEntropy);
        
        // Afficher la clé
        document.getElementById('keyOutput').value = enhancedKey;
        
        // Activer les boutons
        document.getElementById('copyKey').disabled = false;
        document.getElementById('exportKeyPair').disabled = false;
        
        // Mettre à jour le statut
        this.audioKeyGenerator.updateStatus("Clé post-quantique renforcée générée avec succès", "success");
      } else {
        // Utiliser la méthode originale si pas d'entropie supplémentaire
        this.originalGenerateKey();
      }
      
    } catch (error) {
      console.error("Erreur lors de la génération de la clé:", error);
      this.audioKeyGenerator.updateStatus(`Erreur lors de la génération de la clé: ${error.message}`, "error");
    }
  }
}

// Fonction pour démarrer le générateur de clé amélioré
function initEnhancedKeyGenerator() {
  const generator = new EnhancedPostQuantumKeyGenerator();
  generator.init().catch(error => {
    console.error("Erreur d'initialisation:", error);
  });
}

// Démarrer l'application au chargement de la page
window.addEventListener('DOMContentLoaded', initEnhancedKeyGenerator);

// Exporter la classe pour une utilisation externe
export default EnhancedPostQuantumKeyGenerator;