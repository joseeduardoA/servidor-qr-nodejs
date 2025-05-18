const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Rutas de archivos
const personasPath = path.join(__dirname, 'personas.json');
const listaPath = path.join(__dirname, 'Lista.json');

// Funciones útiles
const leerJSON = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  const contenido = fs.readFileSync(filePath, 'utf8');
  return contenido ? JSON.parse(contenido) : [];
};

const guardarJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Inicio.html'));
});

app.get('/personas.json', (req, res) => {
  const personas = leerJSON(personasPath);
  res.json(personas);
});
app.get('/alumnos.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'alumnos.html'));
});
app.get('/Generar.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Generar.html'));
});
// Generar QR con enlace directo a /personas/:id
app.post('/generar-qr', async (req, res) => {
  const { nombre, edad, id, semestre } = req.body;
  const personas = leerJSON(personasPath);

  const persona = personas.find(p =>
    p.nombre === nombre &&
    parseInt(p.edad) === parseInt(edad) &&
    parseInt(p.id) === parseInt(id) &&
    p.semestre === semestre
  );
  
  

  if (!persona) {
    return res.json({ success: false, message: 'No se encontró una persona con esos datos.' });
  }

  const qrURL = `${req.protocol}://${req.get('host')}/personas/${id}`;

  try {
    const qrImage = await QRCode.toDataURL(qrURL);
    res.json({ success: true, qr: qrImage });
    // res.send(`
    //   <h2>Escanea el código QR:</h2>
    //   <img src="${qrImage}" alt="QR Code">
    //   <p><a href="${qrURL}">Ver enlace directo</a></p>
    // `);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error generando el código QR.' });
  }
});
    

app.post('/guardar-qr', async (req, res) => {

  const { qr } = req.body;
  try {
    const url = new URL(qr);
    const idMatch = url.pathname.match(/\/personas\/(\d+)/);

    if (!idMatch) return res.status(400).send('QR no válido');

    const id = parseInt(idMatch[1]);
    const personas = leerJSON(personasPath);
    const persona = personas.find(p => p.id === id);

    if (!persona) return res.status(404).send('Persona no encontrada');

    const lista = leerJSON(listaPath);
    const yaRegistrado = lista.some(p => p.id === persona.id);


    // Obtener hora actual en Puebla con TimeZoneDB
    const resHora = await fetch(`http://api.timezonedb.com/v2.1/get-time-zone?key=NXQ9L8DRVSOG&format=json&by=zone&zone=America/Mexico_City`);
    const horaData = await resHora.json();

    const horaCompleta = horaData.formatted; // Ejemplo: "2025-05-14 20:43:00"
    const fecha = horaCompleta.split(" ")[0]; // Solo la fecha: "2025-05-14"
    
    lista.push({
      id: persona.id,
      nombre: persona.nombre,
      email: persona.email,
      semestre: persona.semestre,
      timestamp: fecha
    });
    guardarJSON(listaPath, lista);

    res.send('Persona registrada correctamente desde QR');

  } catch (error) {
    console.error(error);
    res.status(500).send('Error al procesar el QR');
  }
});
app.get('/Lista.json', (req, res) => {
  const lista = leerJSON("Lista.json");
  res.json(lista);
});

app.get('/agregarALumno.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'agregarALumno.html'));
});
app.get('/contrasena.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'contrasena.html'));
});
app.get('/profesores.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'profesores.html'));
});
app.get('/listas.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'listas.html'));
});
// Acceso a persona + guardado automático en Lista.json
app.get('/personas/:id', (req, res) => {
  const id = parseInt(req.params.id);
 // Asegura tipo
  const personas = leerJSON(personasPath);
  const persona = personas.find(p => p.id === id);

  if (!persona) return res.status(404).json({ error: 'Persona no encontrada' });

  const lista = leerJSON(listaPath);
  // const yaRegistrado = lista.some(p => p.timestamp === persona.id);

    lista.push({
      id: persona.id,
      nombre: persona.nombre,
      email: persona.email,
      timestamp: new Date().toISOString()
    });
    guardarJSON(listaPath, lista);


  // En lugar de HTML, responde directamente con el JSON de la persona
  res.json(persona);
});


// Ver lista.json en JSON
app.get('/DatosRecolectados', (req, res) => {
  const lista = leerJSON(listaPath);
  res.json(lista);
});




app.post("/personas.json", (req, res) => {
  const nuevaPersona = req.body;

  let personas = [];
  if (fs.existsSync(personasPath)) {
    personas = JSON.parse(fs.readFileSync(personasPath));
  }

  const existe = personas.some(p => p.id === nuevaPersona.id);

  if (existe) {
    return res.json({ message: "ID ya registrado. No se agregó." });
  }

  personas.push(nuevaPersona);
  fs.writeFileSync(personasPath, JSON.stringify(personas, null, 2));
  res.json({ message: "Persona guardada exitosamente." });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});






