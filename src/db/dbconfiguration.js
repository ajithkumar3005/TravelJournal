import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export async function initDB() {
  try {
    const database = await SQLite.openDatabase({
      name: 'traveljournal.db',
      location: 'default',
    });

    await database.executeSql(
      `CREATE TABLE IF NOT EXISTS journals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        photos TEXT,
        date TEXT,
        location TEXT,
        tags TEXT,
        isOffline BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    );

    // Add column if it doesn't exist (for existing tables)
    try {
      await database.executeSql(
        `ALTER TABLE journals ADD COLUMN isOffline BOOLEAN DEFAULT 1;`,
      );
    } catch (e) {
      // Column might already exist, ignore error
    }

    console.log('✅ Database and tables initialized');
    return database;
  } catch (error) {
    console.error('❌ Error in initDB:', error);
    throw error;
  }
}

export async function saveEntry(entryData) {
  console.log('entryData', entryData);

  try {
    const database = await SQLite.openDatabase({
      name: 'traveljournal.db',
      location: 'default',
    });

    const result = await database.executeSql(
      `INSERT INTO journals (
        title, description, photos, date, location, tags, isOffline
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        entryData.title || null,
        entryData.description || null,
        entryData.photos ? JSON.stringify(entryData.photos) : null,
        entryData.date || new Date().toISOString(),
        entryData.location || 'Unknown',
        entryData.tags ? JSON.stringify(entryData.tags) : null,
        1, // Default to true/1 for offline
      ],
    );
    return { success: true, id: result[0].insertId };
  } catch (error) {
    console.error('Error inserting journal entry:', error);
    return { success: false, error };
  }
}

export async function getEntries() {
  try {
    const database = await SQLite.openDatabase({
      name: 'traveljournal.db',
      location: 'default',
    });

    const [results] = await database.executeSql(
      'SELECT * FROM journals ORDER BY date DESC',
    );

    const entries = results.rows.raw().map(row => {
      return {
        ...row,
        photos: row.photos || '[]',
        tags: row.tags || '[]',
      };
    });

    return entries;
  } catch (error) {
    console.error('Error getting entries:', error);
    return [];
  }
}

export async function updateDataEntry(id, entryData) {
  try {
    const database = await SQLite.openDatabase({
      name: 'traveljournal.db',
      location: 'default',
    });

    const result = await database.executeSql(
      `UPDATE journals 
       SET title = ?, description = ?, photos = ?, 
           date = ?, location = ?, tags = ?, isOffline = ?
       WHERE id = ?`,
      [
        entryData.title,
        entryData.description,
        typeof entryData.photos === 'string'
          ? entryData.photos
          : JSON.stringify(entryData.photos),
        entryData.date,
        entryData.location,
        typeof entryData.tags === 'string'
          ? entryData.tags
          : JSON.stringify(entryData.tags),
        1, // Keep as offline
        id,
      ],
    );

    if (result[0].rowsAffected === 0) {
      throw new Error(`No entry found with id ${id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating entry:', error);
    return {
      success: false,
      error: error.message || 'Failed to update entry',
    };
  }
}

export async function deleteEntry(id) {
  try {
    const database = await SQLite.openDatabase({
      name: 'traveljournal.db',
      location: 'default',
    });
    await database.executeSql('DELETE FROM journals WHERE id = ?', [id]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting entry:', error);
    return { success: false, error };
  }
}

export async function clearDatabase() {
  try {
    const database = await SQLite.openDatabase({
      name: 'traveljournal.db',
      location: 'default',
    });

    await database.executeSql('DELETE FROM journals;');
    await database.executeSql('DELETE FROM users;');
    return { success: true };
  } catch (error) {
    console.error('Error clearing database:', error);
    return { success: false, error };
  }
}
