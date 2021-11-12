let db;
let expenseVersion;

// db request
const request = indexedDB.open('expenseDB', expenseVersion || 21);

request.onupgradeneeded = function (e) {
    const { oldVersion } = e;
    const newVersion = e.newVersion || db.version;

    db = e.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('expenseStore', { autoIncrement: true });
    }
};

request.onerror = function (e) {
    console.log(`oop. ${e.target.errorCode}`);
};

function checkDatabase() {
    // open transaction on expenseStore db
    let transaction = db.transaction(['expenseStore'], 'readwrite');

    // access store object
    const store = transaction.objectStore('expenseStore');

    const getAll = store.getAll();

    // if successful
    getAll.onsuccess = function () {
        // bulk re-add items when back online
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "*/*","Content-Type": "application/JSON"
                }
            })
                .then(response => {
                return response.json()
                })
                .then(() => {
                // delete if successful
                    const transaction = db.transaction(['pending'], 'readwrite');
                    const store = transaction.objectStore('pending');
                    store.clear();
            })
        }
    }
}

// listen for online
window.addEventListener("online", checkDatabase);