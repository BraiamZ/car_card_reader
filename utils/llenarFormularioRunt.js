import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * Función corregida que inyecta los datos directamente en las cajas 
 * interactivas del formulario del RUNT, evitando desalineaciones visuales.
 */
export async function generarFormularioRunt(datosVehiculo) {
  try {
    const rutaPlantilla = path.join(process.cwd(), 'public', 'formulario_runt.pdf');
    const plantillaBytes = fs.readFileSync(rutaPlantilla);
    const pdfDoc = await PDFDocument.load(plantillaBytes);
    
    // Obtener el diccionario de formularios del PDF interactivo
    const form = pdfDoc.getForm();

    if (!form || form.getFields().length === 0) {
      throw new Error("El PDF no tiene campos interactivos. Asegúrate de haberlo guardado correctamente en PDFescape.");
    }

    // =========================================================================
    // INYECCIÓN DIRECTA POR NOMBRE DE CAMPO (Ajusta los nombres según los creaste)
    // =========================================================================
    
    // El operador '?.' evita que el código falle si olvidaste crear algún campo
    form.getTextField('organismoTransito')?.setText(datosVehiculo.organismo_de_transito || '');
    form.getTextField('placaNumero')?.setText(datosVehiculo.placa.substring(0,3) || '');
    form.getTextField('placaLetras')?.setText(datosVehiculo.placa.substring(3,3) || '');
    form.getTextField('marca')?.setText(datosVehiculo.marca || '');
    form.getTextField('linea')?.setText(datosVehiculo.linea || '');
    form.getTextField('modelo')?.setText(datosVehiculo.modelo || '');
    form.getTextField('color')?.setText(datosVehiculo.color || '');
    form.getTextField('potencia')?.setText(datosVehiculo.potencia || '');

    if (datosVehiculo.combustible === 'DIESEL'){
      form.getTextField('combustibleDiesel')?.setText('X');
    }
    if (datosVehiculo.combustible === 'GASOLINA'){
      form.getTextField('combustibleGasolina')?.setText('X');
    }
    if (datosVehiculo.combustible === 'GAS'){
      form.getTextField('combustibleGas')?.setText('X');
    }
    form.getTextField('capacidad')?.setText(datosVehiculo.capacidad || ''); 
    form.getTextField('cilindraje')?.setText(datosVehiculo.cilindraje || '');
    

    console.log(datosVehiculo)
    // Identificaciones seriales
    form.getTextField('numeroMotor')?.setText(datosVehiculo.numero_motor || '');
    form.getTextField('numeroChasis')?.setText(datosVehiculo.numero_chasis || '');
    form.getTextField('numeroSerie')?.setText(datosVehiculo.numero_serie || '');
    form.getTextField('numeroVin')?.setText(datosVehiculo.numero_vin || '');

    // Datos del propietario
    form.getTextField('propietarioNombres')?.setText(datosVehiculo.propietario_nombre || '');
    form.getTextField('propietarioNumeroDocumento')?.setText(datosVehiculo.propietario_numero_identificacion || '');
    form.getTextField('propietarioPrimerApellido')?.setText(datosVehiculo.propietario_primer_apellido || '');
    form.getTextField('propietarioSegundoApellido')?.setText(datosVehiculo.propietario_segundo_apellido || '');
    if(datosVehiculo.propietario_tipo_identificacion === 'C.C.') {
      form.getTextField('propietarioTipoCC')?.setText('X');
    }
    if(datosVehiculo.propietario_tipo_identificacion === 'NIT') {
      form.getTextField('propietarioTipoNIT')?.setText('X');
    }

    if (datosVehiculo.servicio === 'PARTICULAR') {
      form.getTextField('servicioParticular')?.setText('X');
    }

    if(datosVehiculo.clase_de_vehiculo === 'CAMIONETA') {
      form.getTextField('vehiculoCamioneta')?.setText('X');
    }
    if(datosVehiculo.clase_de_vehiculo === 'AUTOMOVIL') {
      form.getTextField('vehiculoAutomovil')?.setText('X');
    }
    form.getTextField('tipoCarroceria')?.setText(datosVehiculo.tipo_de_carroceria || '');
    
  
    form.flatten();

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);

  } catch (error) {
    console.error("Error al rellenar el formulario interactivo RUNT:", error);
    throw error;
  }
}
