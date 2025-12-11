import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Truck, 
  Calendar, 
  Settings, 
  Activity, 
  GitBranch, 
  Disc, 
  Fuel, 
  FileText, 
  Upload, 
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  Building,
  Save,
  FileUp,
  Trash2,
  Sparkles,
  X,
  Camera,
  Loader2,
  CheckCircle2,
  Type,
  Download
} from 'lucide-react';

export default function App() {
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState('editor');
  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Estado inicial
  const defaultData = {
    // Datos de Empresa
    companyName: 'TRACTOS DEL BAJÍO',
    companyPhone: '442-123-4567',
    companyEmail: 'ventas@tractosdelbajio.com',
    companyAddress: 'Querétaro, México',
    logoUrl: null,

    // Datos Cliente
    clientName: 'Transportes Logísticos S.A. de C.V.',
    quoteDate: new Date().toISOString().split('T')[0],
    quoteId: 'COT-2025-001',

    // Datos Vehículo
    price: 0, 
    currency: 'MXN',
    year: '',
    model: '',
    brand: '',
    engineShort: '',
    engineFull: '',
    
    // CAMPOS ESPECÍFICOS SOLICITADOS EN BLANCO
    transmissionShort: '',
    transmissionFull: '',
    suspensionShort: '',
    suspensionFull: '',
    towingCapacity: '', 
    
    axles: '',
    fuel: 'Diesel',
    mileage: '',
    invoiceType: 'Refacturado',
    wheelSize: '', 
    gearRatio: '',
    vin: '',
    renovationNote: 'Este tractocamión tiene un proceso de renovación total mecánica y estética.',
    imageUrl: '',

    // Textos Personalizables
    labelQuoteTitle: 'COTIZACIÓN',
    labelClient: 'Atención a:',
    labelPrice: 'Precio de Lista',
    labelRenovationTitle: 'Garantía de Calidad',
    labelSpecsTitle: 'Ficha Técnica',
    footerTitle: '¿Listo para hacer negocio?',
    footerText: 'Contáctanos para agendar una prueba de manejo.',
    generatedBy: 'Documento generado por Tractos.Com'
  };

  const [formData, setFormData] = useState(defaultData);

  // --- EFECTOS DE PERSISTENCIA Y CARGA DE SCRIPTS ---
  useEffect(() => {
    const savedData = localStorage.getItem('tractosQuoteData');
    if (savedData) {
      try { 
        const parsed = JSON.parse(savedData);
        setFormData({ ...defaultData, ...parsed }); 
      } catch (e) { console.error(e); }
    }
    
    // Cargar Tesseract (OCR)
    if (!window.Tesseract && !document.getElementById('tesseract-script')) {
        const script = document.createElement('script');
        script.id = 'tesseract-script';
        script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
        script.async = true;
        document.body.appendChild(script);
    }

    // Cargar html2pdf (PDF Generator)
    if (!window.html2pdf && !document.getElementById('html2pdf-script')) {
        const script = document.createElement('script');
        script.id = 'html2pdf-script';
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        script.async = true;
        document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tractosQuoteData', JSON.stringify(formData));
  }, [formData]);

  // --- MANEJADORES DE INPUT ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    if(confirm("¿Estás seguro de limpiar todos los campos? Se perderán los cambios no guardados.")) {
      setFormData(defaultData);
    }
  };

  // --- LÓGICA DE EXTRACCIÓN MEJORADA ---
  const parseTextToData = (text) => {
    let updates = {};
    const priceMatch = text.match(/(\$|precio|valor)[\s\.:]?\s?([0-9,]+)(\.[0-9]{2})?/i);
    if (priceMatch) {
      const rawPrice = parseFloat(priceMatch[2].replace(/,/g, ''));
      if (rawPrice > 1000) updates.price = rawPrice;
    }
    const yearMatch = text.match(/\b(20[1-2][0-9])\b/);
    if (yearMatch) updates.year = yearMatch[1];
    
    const vinMatch = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
    if (vinMatch) updates.vin = vinMatch[0].toUpperCase();
    
    const mileageMatch = text.match(/([0-9,]+)\s*(km|millas|miles|kms)/i);
    if (mileageMatch) updates.mileage = mileageMatch[0];
    
    const engineMatch = text.match(/(Cummins|Detroit|Paccar|Volvo|Navistar)\s?([A-Za-z0-9\s]+)?/i);
    if (engineMatch) {
        updates.engineShort = engineMatch[1];
        updates.engineFull = engineMatch[0]; 
    }
    
    const transMatch = text.match(/(Eaton|Fuller|Allison|Tremec|Transmisi[oó]n)[\s:]*([0-9\s\w\-]+)/i);
    if (transMatch && transMatch[2].length > 3) {
        updates.transmissionShort = transMatch[2].substring(0, 15);
        updates.transmissionFull = transMatch[0];
    }

    const suspMatch = text.match(/(Suspensi[oó]n|Susp)[\s:]*([A-Za-z0-9\-\s]+)/i);
    if (suspMatch && suspMatch[2].length > 3) {
        updates.suspensionShort = suspMatch[2].substring(0, 15);
        updates.suspensionFull = suspMatch[2];
    }

    const towMatch = text.match(/(Arrastre|Capacidad|Towing)[\s:]*([0-9,]+[\s]*(Lbs|Kg|Tons))/i);
    if (towMatch) updates.towingCapacity = towMatch[2];
    
    const modelMatch = text.match(/(T680|T800|Cascadia|VNL|ProStar|LT|W900|T880|Anthem)/i);
    if (modelMatch) updates.model = modelMatch[0];
    
    const brandMatch = text.match(/(Kenworth|Freightliner|International|Volvo|Mack|Peterbilt)/i);
    if (brandMatch) updates.brand = brandMatch[0];
    
    return updates;
  };

  const handleSmartParse = () => {
    if (!pastedText) return;
    const updates = parseTextToData(pastedText);
    applyUpdates(updates);
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.Tesseract) {
        alert("El sistema de OCR está cargando. Espera un momento.");
        return;
    }

    setIsProcessing(true);
    setOcrProgress(0);

    try {
        const result = await window.Tesseract.recognize(file, 'eng', {
            logger: m => { if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100)); }
        });
        const text = result.data.text;
        setPastedText(text);
        const updates = parseTextToData(text);
        applyUpdates(updates);
    } catch (error) {
        console.error(error);
        alert("Error al leer la imagen.");
    } finally {
        setIsProcessing(false);
    }
  };

  const applyUpdates = (updates) => {
    const count = Object.keys(updates).length;
    if (count > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
        alert(`¡Éxito! Se detectaron ${count} datos nuevos.`);
        setShowSmartPaste(false);
        setPastedText('');
    } else {
        alert("No se detectaron datos claros. Los campos permanecerán vacíos.");
    }
  };

  // --- GESTIÓN DE ARCHIVOS Y PDF ---
  const exportData = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cotizacion-${formData.quoteId}.json`;
    link.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        setFormData({ ...defaultData, ...parsed });
        alert("Cargado correctamente.");
      } catch (error) { alert("Error de archivo."); }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  // Función Nueva para Descargar PDF Directamente
  const handleDownloadPDF = () => {
    if (!window.html2pdf) {
        alert("La librería PDF aún está cargando. Intenta en 3 segundos.");
        return;
    }
    
    setIsGeneratingPdf(true);
    const element = document.getElementById('printable-area');
    
    // OPCIONES TAMAÑO CARTA
    const opt = {
      margin: 0,
      filename: `Cotizacion-${formData.quoteId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true }, 
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' } 
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
        setIsGeneratingPdf(false);
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00 MXN';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans text-slate-800">
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body, html, #root { 
              height: initial !important; 
              overflow: visible !important; 
              background: white;
          }
          /* Ocultar todo excepto el área de impresión */
          body > * { display: none !important; }
          
          /* Forzar que el contenedor principal sea visible */
          .print\\:block { display: block !important; }
          
          #printable-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 99999;
            visibility: visible !important;
            overflow: visible !important;
          }
          #printable-area * {
            visibility: visible !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* MODAL IMPORTACIÓN */}
      {showSmartPaste && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                        <Sparkles className="text-yellow-500" /> Asistente
                    </h3>
                    <button onClick={() => setShowSmartPaste(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                {isProcessing ? (
                    <div className="py-12 text-center">
                        <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-gray-800">Analizando...</h4>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-xs mx-auto mt-4">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{width: `${ocrProgress}%`}}></div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center cursor-pointer relative group hover:bg-blue-100">
                            <input type="file" accept="image/*" onChange={handleOcrUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            <Camera size={32} className="mx-auto text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="font-bold text-blue-900">Subir Captura</h4>
                        </div>
                        <div className="relative flex items-center py-2">
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase w-full text-center">O pegar texto</span>
                        </div>
                        <div>
                            <textarea className="w-full h-24 p-3 border border-gray-300 rounded-md text-xs font-mono mb-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Pega aquí el texto..." value={pastedText} onChange={(e) => setPastedText(e.target.value)}></textarea>
                            <button onClick={handleSmartParse} disabled={!pastedText} className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white py-2 rounded font-bold transition-colors">Procesar Texto</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* EDITOR (IZQUIERDA) */}
      <div className="w-full md:w-1/3 bg-white p-6 shadow-lg overflow-y-auto h-screen print:hidden border-r border-gray-200 flex flex-col relative z-20">
        <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-100 mb-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                    <Settings size={20} /> Editor
                </h2>
                {/* BOTÓN DESCARGAR PDF */}
                <button 
                    onClick={handleDownloadPDF} 
                    disabled={isGeneratingPdf}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
                >
                    {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF (Carta)'}
                </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={exportData} className="flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-2 rounded text-xs font-bold transition-colors"><Save size={14} /> Guardar Datos</button>
                <label className="cursor-pointer flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-3 py-2 rounded text-xs font-bold transition-colors"><FileUp size={14} /> Cargar Datos <input type="file" className="hidden" accept=".json" onChange={importData} /></label>
            </div>
            
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowSmartPaste(true)} className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-2 rounded text-xs font-bold"><Sparkles size={14} /> Importar</button>
                <button onClick={resetForm} className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 px-3 py-2 rounded text-xs font-bold transition-colors">
                    <Trash2 size={14} /> Nuevo
                </button>
            </div>
        </div>

        <div className="space-y-6 pb-20">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2"><Building size={14} /> Empresa y Logo</h3>
            <div className="grid gap-3">
              <label className="cursor-pointer bg-white border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm w-full flex items-center justify-center gap-2 transition-colors"><Upload size={14} /> {formData.logoUrl ? 'Cambiar Logo' : 'Subir Logo'} <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} /></label>
              <input type="text" name="companyName" placeholder="Nombre" value={formData.companyName} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              <input type="text" name="companyAddress" placeholder="Dirección" value={formData.companyAddress} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              <div className="grid grid-cols-2 gap-2">
                 <input type="text" name="companyPhone" placeholder="Tel" value={formData.companyPhone} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
                 <input type="text" name="companyEmail" placeholder="Email" value={formData.companyEmail} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Cliente</h3>
             <div className="grid gap-3">
                <input type="text" name="clientName" placeholder="Cliente" value={formData.clientName} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" name="quoteDate" value={formData.quoteDate} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
                  <input type="text" name="quoteId" placeholder="Folio" value={formData.quoteId} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
                </div>
             </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Vehículo</h3>
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Precio</label>
                <input type="number" name="price" placeholder="Precio" value={formData.price} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" name="year" placeholder="Año" value={formData.year} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
                <input type="text" name="model" placeholder="Modelo" value={formData.model} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              </div>
              <input type="text" name="engineShort" placeholder="Motor (Resumen)" value={formData.engineShort} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              <div className="mt-2">
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded text-sm w-full text-center flex items-center justify-center gap-2"><Upload size={14} /> Subir Foto Camión <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Detalles</h3>
            <div className="grid gap-3">
              <div className="mb-2">
                <label className="text-xs text-blue-600 font-bold">Nota de Renovación</label>
                <textarea name="renovationNote" value={formData.renovationNote} onChange={handleInputChange} className="w-full p-2 text-sm border border-blue-200 bg-blue-50 rounded h-20 text-xs" placeholder="Describe el estado de la unidad..." />
              </div>
              <input type="text" name="brand" placeholder="Marca" value={formData.brand} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              <input type="text" name="engineFull" placeholder="Motor Completo" value={formData.engineFull} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              
              <label className="text-xs font-bold text-gray-400 mt-2">Transmisión</label>
              <input type="text" name="transmissionFull" placeholder="Ej: Eaton Fuller 18 Vel..." value={formData.transmissionFull} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              
              <div className="grid grid-cols-2 gap-2">
                <input type="text" name="fuel" placeholder="Combustible" value={formData.fuel} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
                <input type="text" name="mileage" placeholder="Kilometraje" value={formData.mileage} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              </div>
              <input type="text" name="wheelSize" placeholder="Rodado" value={formData.wheelSize} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              
              <label className="text-xs font-bold text-gray-400 mt-2">Suspensión</label>
              <input type="text" name="suspensionFull" placeholder="Ej: Neumática..." value={formData.suspensionFull} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              
              <label className="text-xs font-bold text-gray-400 mt-2">Capacidad de Arrastre</label>
              <input type="text" name="towingCapacity" placeholder="Ej: 46,000 Lbs" value={formData.towingCapacity} onChange={handleInputChange} className="w-full p-2 text-sm border rounded" />
              
              <input type="text" name="vin" placeholder="VIN" value={formData.vin} onChange={handleInputChange} className="w-full p-2 text-sm border rounded mt-2" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <Type size={14} /> Personalización de Textos
            </h3>
            <div className="grid gap-3">
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Título Documento</label>
                    <input type="text" name="labelQuoteTitle" value={formData.labelQuoteTitle || 'COTIZACIÓN'} onChange={handleInputChange} className="w-full p-2 text-xs border rounded" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Etiqueta Cliente</label>
                        <input type="text" name="labelClient" value={formData.labelClient || 'Atención a:'} onChange={handleInputChange} className="w-full p-2 text-xs border rounded" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Etiqueta Precio</label>
                        <input type="text" name="labelPrice" value={formData.labelPrice || 'Precio de Lista'} onChange={handleInputChange} className="w-full p-2 text-xs border rounded" />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Título Renovación</label>
                    <input type="text" name="labelRenovationTitle" value={formData.labelRenovationTitle || 'Garantía de Calidad'} onChange={handleInputChange} className="w-full p-2 text-xs border rounded" />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Título Footer</label>
                    <input type="text" name="footerTitle" value={formData.footerTitle || '¿Listo para hacer negocio?'} onChange={handleInputChange} className="w-full p-2 text-xs border rounded" />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Texto Footer</label>
                    <textarea name="footerText" value={formData.footerText || ''} onChange={handleInputChange} className="w-full p-2 text-xs border rounded h-16" />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400">Créditos (Abajo)</label>
                    <input type="text" name="generatedBy" value={formData.generatedBy || 'Documento generado por Tractos.Com'} onChange={handleInputChange} className="w-full p-2 text-xs border rounded" />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* DOCUMENTO IMPRIMIBLE (DERECHA) */}
      {/* CAMBIO: Dimensiones ajustadas a TAMAÑO CARTA (216mm x 279mm) */}
      <div className="w-full md:w-2/3 bg-gray-200 p-8 overflow-y-auto print:p-0 print:overflow-visible print:w-full print:bg-white flex justify-center print:block">
        <div id="printable-area" className="bg-white shadow-2xl w-[216mm] min-h-[279mm] p-10 relative box-border flex flex-col">
          
          <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
            <div className="w-1/2">
              {formData.logoUrl ? <img src={formData.logoUrl} alt="Logo" className="h-16 object-contain mb-3" /> : <div className="mb-3"><h1 className="text-4xl font-black italic">TRACTOS</h1></div>}
              <div className="text-gray-500 text-sm mt-2 space-y-1">
                <p className="flex items-center gap-2"><MapPin size={12} /> {formData.companyAddress}</p>
                <p className="flex items-center gap-2"><Phone size={12} /> {formData.companyPhone}</p>
                <p className="flex items-center gap-2"><Mail size={12} /> {formData.companyEmail}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-bold text-gray-200 uppercase">{formData.labelQuoteTitle || 'COTIZACIÓN'}</h2>
              <p className="text-black font-bold mt-2 text-lg">Folio: {formData.quoteId}</p>
              <p className="text-gray-500 text-sm">{formData.quoteDate}</p>
            </div>
          </div>

          <div className="mb-8">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{formData.labelClient || 'Atención a:'}</span>
            <h2 className="text-xl font-bold text-gray-800 border-l-4 border-black pl-3">{formData.clientName}</h2>
          </div>

          <div className="mb-4">
             <h2 className="text-3xl font-bold text-slate-900">{formData.brand} {formData.model} <span className="text-gray-300 font-light mx-2">|</span> {formData.year}</h2>
             <p className="text-md text-gray-500 font-medium mt-1">{formData.engineShort}</p>
          </div>

          <div className="bg-gray-100 rounded-lg overflow-hidden mb-8 border border-gray-200 print:border-none">
            <div className="aspect-video w-full bg-gray-200 relative overflow-hidden">
              {formData.imageUrl ? <img src={formData.imageUrl} alt="Vehículo" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center justify-center h-full text-gray-400"><ImageIcon size={48} className="mb-2 opacity-50" /></div>}
              <div className="absolute bottom-0 right-0 bg-black text-white px-8 py-4 rounded-tl-xl shadow-lg print:shadow-none">
                <p className="text-xs opacity-70 font-medium uppercase tracking-widest mb-1">{formData.labelPrice || 'Precio de Lista'}</p>
                <p className="text-3xl font-bold leading-none">{formatCurrency(formData.price)} <span className="text-xs font-normal opacity-70">MXN</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 mb-8">
             {[
               { icon: Calendar, label: "Año", val: formData.year },
               { icon: Truck, label: "Modelo", val: formData.model },
               { icon: Settings, label: "Motor", val: formData.engineShort },
               { icon: GitBranch, label: "Transmisión", val: formData.transmissionShort },
               { icon: Disc, label: "Ejes", val: formData.axles },
               { icon: Activity, label: "Suspensión", val: formData.suspensionShort },
             ].map((item, i) => (
               <div key={i} className="bg-gray-50 p-2 rounded border border-gray-100 flex flex-col items-center text-center">
                 <item.icon size={16} className="text-black mb-1 opacity-80" />
                 <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">{item.label}</span>
                 <span className="text-xs font-bold text-gray-800 leading-tight">{item.val}</span>
               </div>
             ))}
          </div>

          {formData.renovationNote && (
            <div className="mb-8 bg-gray-100 p-4 rounded-lg border-l-4 border-black flex items-start gap-3">
                <CheckCircle2 className="text-black flex-shrink-0 mt-1" size={24} />
                <div>
                    <h4 className="font-bold text-gray-900 uppercase text-xs tracking-wider mb-1">{formData.labelRenovationTitle || 'Garantía de Calidad'}</h4>
                    <p className="text-gray-800 font-medium leading-tight">{formData.renovationNote}</p>
                </div>
            </div>
          )}

          <div className="mb-10 flex-grow">
            <div className="flex items-center gap-3 mb-4">
               <div className="h-8 w-1 bg-black rounded-full"></div>
               <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{formData.labelSpecsTitle || 'Ficha Técnica'}</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm">
              {[
                { l: "Marca", v: formData.brand },
                { l: "Modelo", v: formData.model },
                { l: "Año", v: formData.year },
                { l: "Motor", v: formData.engineFull },
                { l: "Transmisión", v: formData.transmissionFull },
                { l: "Ejes / Suspensión", v: formData.suspensionFull },
                { l: "Combustible", v: formData.fuel },
                { l: "Paso Diferencial", v: formData.gearRatio },
                { l: "Rodado", v: formData.wheelSize },
                { l: "Capacidad Arrastre", v: formData.towingCapacity },
                { l: "Kilometraje", v: formData.mileage },
                { l: "Tipo Factura", v: formData.invoiceType },
                { l: "VIN", v: formData.vin, font: "font-mono" },
              ].map((row, idx) => (
                <div key={idx} className="flex justify-between items-baseline border-b border-gray-200 pb-1 pt-1 px-2 print:border-gray-300">
                  <span className="text-gray-500 font-medium">{row.l}</span>
                  <span className={`font-bold text-gray-900 text-right ${row.font || ''}`}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black text-white p-6 rounded-lg text-center relative overflow-hidden mt-auto">
            <div className="relative z-10">
                <h4 className="font-bold text-lg mb-1">{formData.footerTitle || '¿Listo para hacer negocio?'}</h4>
                <p className="text-gray-400 text-xs mb-4">{formData.footerText || 'Contáctanos para agendar una prueba de manejo.'}</p>
                <div className="flex flex-wrap justify-center gap-6 text-xs font-medium">
                  <span className="flex items-center gap-2"><Phone size={14} className="text-yellow-500" /> {formData.companyPhone}</span>
                  <span className="flex items-center gap-2"><Mail size={14} className="text-yellow-500" /> {formData.companyEmail}</span>
                </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
             <p className="text-[10px] text-gray-400 uppercase tracking-widest">{formData.generatedBy || 'Documento generado por Tractos.Com'} • {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
