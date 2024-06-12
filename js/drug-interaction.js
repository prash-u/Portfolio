document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('upload-form').addEventListener('submit', predictInteractions);

    // Initialize IndexedDB
    initDatabase().then(db => {
        console.log('Database initialized');
    });
});

async function predictInteractions(event) {
    event.preventDefault();

    const medicationsInput = document.getElementById('medications').value;
    const medications = medicationsInput.split(',').map(med => med.trim().toLowerCase());

    // Check IndexedDB for known interactions
    const knownInteractions = await queryDatabase(medications);

    // If no known interactions found, use ML model for prediction
    let interactions = knownInteractions;
    if (knownInteractions.length === 0) {
        const model = await loadModel();
        const predictions = await predictWithModel(model, medications);
        interactions = interactions.concat(predictions);
    }

    displayResults(interactions);
}

// Initialize IndexedDB for storing drug interaction data
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DrugDB', 1);

        request.onerror = event => {
            console.error('Database error:', event.target.errorCode);
            reject('Failed to open IndexedDB');
        };

        request.onsuccess = event => {
            resolve(event.target.result);
        };

        request.onupgradeneeded = event => {
            const db = event.target.result;
            const objectStore = db.createObjectStore('interactions', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('drugName', 'drugName', { unique: false });

            // Example data to store
            const interactionData = [
                { drugName: 'aspirin', interaction: 'aspirin and ibuprofen increase risk of gastrointestinal bleeding.' },
                { drugName: 'warfarin', interaction: 'warfarin and aspirin can cause bleeding complications.' }
            ];

            interactionData.forEach(data => {
                objectStore.add(data);
            });

            console.log('Database setup complete and data added.');
        };
    });
}

// Query IndexedDB for interactions
function queryDatabase(medications) {
    return new Promise((resolve, reject) => {
        const interactionResults = [];
        const dbRequest = indexedDB.open('DrugDB');

        dbRequest.onsuccess = event => {
            const db = event.target.result;
            const transaction = db.transaction(['interactions'], 'readonly');
            const objectStore = transaction.objectStore('interactions');
            const index = objectStore.index('drugName');

            let processed = 0;

            medications.forEach(med => {
                const request = index.getAll(med);

                request.onsuccess = event => {
                    if (event.target.result.length > 0) {
                        interactionResults.push(...event.target.result.map(result => `${med.charAt(0).toUpperCase() + med.slice(1)}: ${result.interaction}`));
                    }
                    processed++;
                    if (processed === medications.length) {
                        resolve(interactionResults);
                    }
                };

                request.onerror = event => {
                    console.error('Query error:', event.target.errorCode);
                    processed++;
                    if (processed === medications.length) {
                        resolve(interactionResults);
                    }
                };
            });
        };

        dbRequest.onerror = event => {
            console.error('Database error:', event.target.errorCode);
            reject('Failed to open IndexedDB');
        };
    });
}

// Load TensorFlow.js model for predictions
async function loadModel() {
    // Replace with your actual model path
    const model = await tf.loadLayersModel('../model/model.json');
    return model;
}

// Predict interactions using TensorFlow.js model
async function predictWithModel(model, medications) {
    // Placeholder for converting medications to features for the model
    // Replace with actual feature extraction logic
    const features = medications.map(med => med.length); // Simplistic feature example

    const predictions = model.predict(tf.tensor2d(features, [1, features.length]));

    // Process the model predictions (example only)
    const predictedInteractions = predictions.arraySync()[0].map((value, index) => {
        return value > 0.5 ? `${medications[index]} may interact with other drugs` : null;
    }).filter(Boolean);

    return predictedInteractions.length > 0 ? predictedInteractions : ["No interactions found."];
}

// Display results in the HTML
function displayResults(interactions) {
    const resultsContainer = document.getElementById('results-container');
    const resultsElement = document.getElementById('results');

    resultsElement.innerHTML = interactions.join('<br><br>');
    resultsContainer.style.display = 'block';
}
