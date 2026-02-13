function loadCommands(client) {
  const ascii = require('ascii-table');
  const fs = require('fs');
  const path = require('path');

  const table = new ascii().setHeading('Commands', 'Status');
  const commandsArray = [];

  const baseDir = path.join(__dirname, '..', 'Commands');
  const folders = fs.readdirSync(baseDir);

  for (const folder of folders) {
    const folderDir = path.join(baseDir, folder);
    if (!fs.statSync(folderDir).isDirectory()) continue;

    const files = fs.readdirSync(folderDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const fullPath = path.join(folderDir, file);

      delete require.cache[require.resolve(fullPath)];
      const command = require(fullPath);

      if (!command?.data?.name || typeof command.execute !== 'function') {
        console.warn(`⚠️ Komut atlandı: ${folder}/${file} (data.name/execute eksik)`);
        table.addRow(`${folder}/${file}`, 'skipped');
        continue;
      }

      command.folder = folder; // Klasör bilgisini komuta ekliyoruz
      client.commands.set(command.data.name, command);
      commandsArray.push(command.data.toJSON());
      table.addRow(`${folder}/${file}`, 'loaded');
    }
  }

  client.application.commands.set(commandsArray);
  console.log(table.toString(), '\nLoaded events');
}

module.exports = { loadCommands };
