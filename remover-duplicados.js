const fs = require("fs");

const famosos = JSON.parse(fs.readFileSync("src/data/famosos.json", "utf-8"));

const vistos = new Set();

const semDuplicados = famosos.filter((item) => {
  const nome = item.name?.trim().toLowerCase();
  if (!nome) return true;

  if (vistos.has(nome)) {
    return false;
  }

  vistos.add(nome);
  return true;
});

fs.writeFileSync(
  "src/data/famosos-sem-duplicados.json",
  JSON.stringify(semDuplicados, null, 2)
);

console.log(`Total original: ${famosos.length}`);
console.log(`Total sem duplicados: ${semDuplicados.length}`);
console.log(`Removidos: ${famosos.length - semDuplicados.length}`);