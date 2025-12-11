const DB_NAME = "flashcardsDB";
const STORE_NAME = "folders";

// Initialize IndexedDB
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Saving data to IndexedDB
export const saveData = async (data) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            store.clear();
            data.forEach(item => store.put(item));
            transaction.oncomplete = () => {
                // console.log("Saved data");
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (e) {
        console.error("Error saving data:", e);
    }
};

// Load data from IndexedDB
export const loadData = async () => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => {
                // console.log("Stored Data:", request.result);
                resolve(request.result || []);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("Error loading data:", e);
        return [];
    }
};

// Create a new folder and return it
export const createNewFolder = async (name = "") => {
    const data = await loadData();
    const lastFolder = data[data.length - 1]; // Get the last folder in the list

    const newPosition = lastFolder ? lastFolder.position + 1 : 1; // Set position to last folder's position + 1 (or 1 if no folders exist)
    return { id: Date.now().toString(), name, decks: [], position: newPosition };
};

// Adding a folder
export const addFolder = async (name = "") => {
    const data = await loadData();
    const lastFolder = data[data.length - 1]; // Get the last folder in the list

    const newPosition = lastFolder ? lastFolder.position + 1 : 1; // Set position to last folder's position + 1 (or 1 if no folders exist)
    const newFolder = { id: Date.now().toString(), name, decks: [], position: newPosition };

    // console.log("Folder data:", lastFolder, newPosition, newFolder);

    data.push(newFolder);
    await saveData(data);
};

// Save the updated order of folders
export const saveFolders = async (folders) => {
    await saveData(folders);
};

// Add a deck to a folder
export const addDeck = async (folderId, deckName, deckDescription) => {
    const data = await loadData();
    const folder = data.find(f => f.id === folderId);
    if (folder) {
        folder.decks.push({ id: Date.now().toString(), name: deckName, description: deckDescription, cards: [] });
        await saveData(data);
        // console.log("Data has been saved", folder, data);
    }
};

// Create a new card and return it
export const createNewCard = (position, question = "", answer = "") => {
    return {
        "position": position,
        "question": question,
        "answer": answer
    };
};

// Add a card to a deck
export const addCard = async (folderId, deckId, question, answer) => {
    const data = await loadData();
    const folder = data.find(f => f.id === folderId);
    if (folder) {
        const deck = folder.decks.find(d => d.id === deckId);
        if (deck) {
            deck.cards.push({ question, answer });
            await saveData(data);
        }
    }
};

// Add all cards to a deck
export const saveCards = async (folderId, deckId, cards) => {
    const data = await loadData();
    const folder = data.find(f => f.id === folderId);

    if (folder) {
        const deck = folder.decks.find(d => d.id === deckId);
        if (deck) {
            deck.cards = cards;
            await saveData(data);
        }
    }
};

export const deleteDeck = async (folderId, deckId) => {
    const data = await loadData();
    const folder = data.find(f => f.id === folderId);
    const folderIndex = data.indexOf(folder);
    console.log("FolderID & DeckId:", folderId, deckId);

    if (folder) {
        const deck = folder.decks.find(d => d.id === deckId);
        const deckIndex = folder.decks.indexOf(deck);
        console.log("Position:", folderIndex, folder, deckIndex, deck);
        if (deck) {
            folder.decks.splice(deckIndex, 1);
            await saveData(data);
            // console.log("Deck found and deleted");
        }
    }
};
