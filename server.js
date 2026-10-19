import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
// IMPORTACIÓN: Traemos la función de mapeo que creamos para el RUNT
import { generarFormularioRunt } from './utils/llenarFormularioRunt.js';

const app = express();

// CONFIGURACIONES MIDDLEWARE
app.use(cors());
app.use(express.json()); // CRÍTICO: Permite que tu servidor reciba el JSON desde el frontend
app.use(express.static('public')); // Sirve tu interfaz HTML

const upload = multer({ storage: multer.memoryStorage() });

// Inicializa el cliente pegando directamente tu API Key
const ai = new GoogleGenAI({ apiKey: "" });

// =========================================================================
// RUTA 1: RECIBE LAS IMÁGENES Y EXTRAE LOS DATOS CON GEMINI
// =========================================================================
app.post('/api/extraer-tarjeta', upload.array('tarjeta', 2), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron las imágenes.' });
    }

    const imageParts = req.files.map(file => ({
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype
      }
    }));

    const prompt = `
      Analiza las dos imágenes adjuntas, que corresponden a ambas caras de una Licencia de Tránsito de Colombia.
      Consolida la información de ambas caras y devuelve estrictamente un objeto JSON válido, sin bloques de código markdown, con la siguiente estructura exacta:
      {
        "licencia_de_transito": "Texto",
        "clase_de_vehiculo": "Texto",
        "tipo_de_carroceria": "Texto",
        "combustible": "Texto",
        "capacidad": "Texto",
        "cilindraje": "Texto",
        "potencia": "Texto",
        "servicio": "Texto",
        "numero_motor": "Texto",
        "numero_vin": "Texto",
        "numero_serie": "Texto",
        "numero_chasis": "Texto",
        "organismo_de_transito": "Texto",
        "fecha_de_matricula": "Texto",
        "fecha_expedicion_lic_transito": "Texto",
        "placa_letras": "Texto",
        "placa_numeros": "Texto",
        "marca": "Texto",
        "linea": "Texto",
        "modelo": "Texto",
        "color": "Texto",
        "propietario_primer_apellido": "Texto",
        "propietario_segundo_apellido": "Texto",
        "propietario_nombre": "Texto",
        "propietario_tipo_identificacion": "Texto",
        "propietario_numero_identificacion": "Texto"
      }
      Reglas de extracción:
      - Lee "Cilindraje", "Potencia" y "Servicio" de los campos impresos en la licencia.
      - Separa el propietario en primer apellido, segundo apellido y nombre(s), respetando el orden y la ortografía que aparezcan en el documento. No unas esos valores en un solo campo.
      - Separa el tipo de identificación (por ejemplo, CC, NIT, CE o PAS) del número de identificación. El número no debe incluir el tipo ni puntuación ajena al documento.
      - Separa la placa en "placa_letras" y "placa_numeros". Por ejemplo, para ABC123 devuelve "ABC" y "123". Conserva letras adicionales si el formato de la placa las incluye.
      - Conserva los valores tal como aparecen; no inventes, calcules ni completes datos.
      Si un dato no está presente o es ilegible, usa null.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash', 
      contents: [...imageParts, prompt],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const datosVehiculo = JSON.parse(response.text);
    res.json(datosVehiculo);

  } catch (error) {
    console.error('Error al procesar con Gemini:', error);
    res.status(500).json({ error: 'Error interno al procesar las imágenes.' });
  }
});

// =========================================================================
// RUTA 2: RECIBE EL JSON Y GENERA EL PDF DILIGENCIADO DEL RUNT
// =========================================================================
app.post('/api/descargar-runt', async (req, res) => {
  try {
    const datosVehiculo = req.body; // Captura el JSON enviado desde el frontend

    if (!datosVehiculo || Object.keys(datosVehiculo).length === 0) {
      return res.status(400).json({ error: 'No se recibieron datos para llenar el formulario.' });
    }

    // Ejecuta la función que estampa los datos sobre la plantilla estática
    const pdfBuffer = await generarFormularioRunt(datosVehiculo);

    // Configuramos las cabeceras HTTP obligatorias para que el navegador lo reciba como archivo descargable
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=formulario_runt_diligenciado.pdf');
    
    // Despachamos los bytes del archivo binario
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error al generar el PDF del RUNT:', error);
    res.status(500).json({ error: 'No se pudo generar el documento PDF.' });
  }
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
