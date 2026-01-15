// src/db/db.js
export const db = new Dexie("ficha_rpg_db");

db.version(1).stores({
  characters: "id, name, classId, level, updatedAt, createdAt"
});

// CRUD
export async function saveCharacter(character) {
  await db.characters.put(character);
}

export async function getAllCharacters() {
  return db.characters.orderBy("updatedAt").reverse().toArray();
}

export async function getCharacterById(id) {
  return db.characters.get(id);
}

export async function deleteCharacterById(id) {
  await db.characters.delete(id);
}

export async function duplicateCharacterById(id) {
  const original = await db.characters.get(id);
  if (!original) return null;

  const copy = structuredClone(original);
  copy.id = crypto.randomUUID();
  copy.name = `${copy.name || "Sem nome"} (cópia)`;
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();

  await db.characters.put(copy);
  return copy;
}
