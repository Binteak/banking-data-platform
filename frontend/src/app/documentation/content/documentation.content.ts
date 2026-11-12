// ============================================================
// CONTENIDO DE LA DOCUMENTACIÓN
// Bilingüe (en/es). Cada sección describe una pantalla: objetivo, uso,
// variables, reglas/fórmulas, persistencia, API y permisos.
// Fuente de verdad: el código del backend (api/microservices) y del
// frontend. Si cambia una regla o una fórmula, actualízala aquí.
// ============================================================

export interface Txt { en: string; es: string; }

export interface DocField {
  name: string;          // nombre técnico (columna / variable)
  type: string;          // tipo de dato
  required?: boolean;
  description: Txt;
}

export interface DocRule {
  name: Txt;             // nombre del control o métrica
  formula: string;       // expresión (lenguaje neutro)
  description: Txt;
}

export interface DocEndpoint {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  role: 'Public' | 'Any authenticated user' | 'DataAdmin';
  description: Txt;
}

export interface DocBlock {
  title: Txt;
  items: Txt[];
}

export interface DocSection {
  id: string;
  group: Txt;
  title: Txt;
  icon: string;
  route?: string;            // pantalla de la app a la que corresponde
  summary: Txt;
  purpose: Txt;
  steps?: Txt[];             // cómo se usa
  fields?: { title: Txt; rows: DocField[] };
  rules?: { title: Txt; rows: DocRule[] };
  persistence?: Txt[];       // qué se guarda y dónde
  endpoints?: DocEndpoint[];
  blocks?: DocBlock[];       // bloques adicionales (arquitectura, notas)
}

const t = (en: string, es: string): Txt => ({ en, es });

const GROUP_GENERAL = t('General', 'General');
const GROUP_ANALYSIS = t('Analysis', 'Análisis');
const GROUP_DATA = t('Data management', 'Gestión del dato');
const GROUP_GOVERNANCE = t('Governance & reporting', 'Gobierno y reporting');
const GROUP_REFERENCE = t('Reference', 'Referencia');

export const DOC_SECTIONS: DocSection[] = [

  // ==========================================================
  // OVERVIEW
  // ==========================================================
  {
    id: 'overview',
    group: GROUP_GENERAL,
    title: t('Platform overview', 'Visión general'),
    icon: 'pi pi-compass',
    summary: t(
      'End-to-end platform to ingest, validate, explore and report credit risk exposure data.',
      'Plataforma de extremo a extremo para cargar, validar, explorar y reportar datos de exposición de riesgo de crédito.'
    ),
    purpose: t(
      'Banking Data Platform centralises the credit risk exposure dataset (risk_exposures) and applies a controlled flow: data is loaded with strict validation, its quality is checked with business rules and only then is it used to calculate risk metrics. Every relevant action is recorded in an audit log.',
      'Banking Data Platform centraliza el dataset de exposiciones de riesgo de crédito (risk_exposures) y aplica un flujo controlado: los datos se cargan con validación estricta, se comprueba su calidad con reglas de negocio y solo entonces se usan para calcular métricas de riesgo. Cada acción relevante queda registrada en un log de auditoría.'
    ),
    steps: [
      t('Upload Data: load a CSV/XLSX file per country and reporting date into risk_exposures.',
        'Upload Data: carga un fichero CSV/XLSX por país y fecha de reporte en risk_exposures.'),
      t('Dashboard and Data Explorer: review the loaded exposures and the key indicators.',
        'Dashboard y Data Explorer: revisa las exposiciones cargadas y los indicadores clave.'),
      t('Data Quality: run the quality controls for a country + reporting date.',
        'Data Quality: ejecuta los controles de calidad para un país + fecha de reporte.'),
      t('Audit Reporting: calculate the risk metrics; the report is validated only if Data Quality passed.',
        'Audit Reporting: calcula las métricas de riesgo; el informe solo queda validado si Data Quality ha pasado.'),
      t('Housekeeping: search and remove incorrect records before reloading them.',
        'Housekeeping: busca y elimina registros incorrectos antes de volver a cargarlos.'),
    ],
    blocks: [
      {
        title: t('Architecture', 'Arquitectura'),
        items: [
          t('Frontend: Angular 18 (standalone components), PrimeNG, Chart.js and jsPDF. Bilingual interface (EN/ES).',
            'Frontend: Angular 18 (componentes standalone), PrimeNG, Chart.js y jsPDF. Interfaz bilingüe (EN/ES).'),
          t('Backend: Django + Django REST Framework, organised as one microservice module per screen.',
            'Backend: Django + Django REST Framework, organizado en un módulo de microservicio por pantalla.'),
          t('Storage: JSON documents (risk_exposures, data_quality_results, reporting_results, audit_log). The demo starts from a versioned seed.',
            'Almacenamiento: documentos JSON (risk_exposures, data_quality_results, reporting_results, audit_log). La demo arranca desde un seed versionado.'),
          t('Deployment: Docker Compose (nginx + gunicorn) or Render (static site + web service); web and API share the same domain.',
            'Despliegue: Docker Compose (nginx + gunicorn) o Render (static site + web service); la web y la API comparten dominio.'),
        ]
      },
      {
        title: t('Key concepts', 'Conceptos clave'),
        items: [
          t('A dataset is identified by country + reporting date (for example ES · 31/03/2026).',
            'Un dataset se identifica por país + fecha de reporte (por ejemplo ES · 31/03/2026).'),
          t('Each record is one exposure of an entity: amounts (exposure, EAD), risk parameters (PD, LGD), classification (portfolio, product, stage, rating) and default status.',
            'Cada registro es una exposición de una entidad: importes (exposure, EAD), parámetros de riesgo (PD, LGD), clasificación (cartera, producto, stage, rating) y estado de default.'),
          t('Data Quality answers "is the data valid?"; Audit Reporting answers "what does the data say?".',
            'Data Quality responde "¿los datos son válidos?"; Audit Reporting responde "¿qué dicen los datos?".'),
          t('All data in this demo is simulated. Nexum Bank is a fictional brand.',
            'Todos los datos de esta demo son simulados. Nexum Bank es una marca ficticia.'),
        ]
      }
    ]
  },

  // ==========================================================
  // DASHBOARD
  // ==========================================================
  {
    id: 'dashboard',
    group: GROUP_ANALYSIS,
    title: t('Dashboard', 'Dashboard'),
    icon: 'pi pi-home',
    route: '/dashboard',
    summary: t(
      'Snapshot of the latest reporting date: volume, exposure at default and default rate.',
      'Resumen de la última fecha de reporte: volumen, exposición en default y tasa de default.'
    ),
    purpose: t(
      'Gives a quick view of the most recent dataset loaded in the platform and acts as the entry point to the rest of the modules.',
      'Ofrece una vista rápida del dataset más reciente cargado en la plataforma y sirve de punto de entrada al resto de módulos.'
    ),
    steps: [
      t('Open the Dashboard after signing in; the indicators are calculated automatically.',
        'Abre el Dashboard tras iniciar sesión; los indicadores se calculan automáticamente.'),
      t('Use the module shortcuts to go to Upload Data, Data Explorer, Data Quality or Audit Reporting.',
        'Usa los accesos directos para ir a Upload Data, Data Explorer, Data Quality o Audit Reporting.'),
    ],
    rules: {
      title: t('Indicators', 'Indicadores'),
      rows: [
        { name: t('Latest reporting date', 'Última fecha de reporte'), formula: 'max(reporting_date)',
          description: t('Most recent reporting date in risk_exposures. All indicators use only these records.', 'Fecha de reporte más reciente en risk_exposures. Todos los indicadores usan solo esos registros.') },
        { name: t('Countries', 'Países'), formula: 'count(distinct country)',
          description: t('Number of countries loaded for the latest reporting date.', 'Número de países cargados para la última fecha de reporte.') },
        { name: t('Risk exposures', 'Exposiciones'), formula: 'N = count(records)',
          description: t('Number of exposure records in the latest dataset.', 'Número de registros de exposición del último dataset.') },
        { name: t('Exposure at default', 'Exposición en default (EAD)'), formula: 'Σ ead_amount',
          description: t('Sum of EAD of the latest dataset, shown in compact EUR format.', 'Suma del EAD del último dataset, en formato EUR compacto.') },
        { name: t('Default rate', 'Tasa de default'), formula: 'count(default_flag = true) / N',
          description: t('Share of defaulted exposures; the card is highlighted when there is at least one default.', 'Proporción de exposiciones en default; la tarjeta se resalta si hay al menos un default.') },
      ]
    },
    endpoints: [
      { method: 'GET', path: '/api/getRiskExposures/', role: 'Any authenticated user',
        description: t('Returns all exposures; the indicators are computed in the browser.', 'Devuelve todas las exposiciones; los indicadores se calculan en el navegador.') },
    ]
  },

  // ==========================================================
  // DATA EXPLORER
  // ==========================================================
  {
    id: 'data-explorer',
    group: GROUP_ANALYSIS,
    title: t('Data Explorer', 'Data Explorer'),
    icon: 'pi pi-search',
    route: '/data-explorer',
    summary: t(
      'Interactive exploration of the exposure dataset with filters, totals and record detail.',
      'Exploración interactiva del dataset de exposiciones con filtros, totales y detalle de cada registro.'
    ),
    purpose: t(
      'Lets analysts review the loaded data before validating or reporting it: filter by any dimension, check totals and open the detail of a single exposure.',
      'Permite a los analistas revisar los datos cargados antes de validarlos o reportarlos: filtrar por cualquier dimensión, comprobar totales y abrir el detalle de una exposición.'
    ),
    steps: [
      t('Combine filters: reporting date, country, portfolio, product type, risk stage, rating, default status and data source.',
        'Combina filtros: fecha de reporte, país, cartera, tipo de producto, risk stage, rating, estado de default y origen del dato.'),
      t('Use the free-text search to find an entity by ID or name.',
        'Usa la búsqueda libre para encontrar una entidad por ID o nombre.'),
      t('Active filters are shown as chips above the table; remove them one by one or clear them all.',
        'Los filtros activos se muestran como chips encima de la tabla; quítalos uno a uno o límpialos todos.'),
      t('Open "View detail" to see every field of an exposure, or export the filtered table to CSV.',
        'Abre "Ver detalle" para ver todos los campos de una exposición, o exporta la tabla filtrada a CSV.'),
    ],
    rules: {
      title: t('Summary figures (over the filtered records)', 'Cifras resumen (sobre los registros filtrados)'),
      rows: [
        { name: t('Records', 'Registros'), formula: 'N = count(filtered records)',
          description: t('Records that match all active filters.', 'Registros que cumplen todos los filtros activos.') },
        { name: t('Total exposure', 'Exposición total'), formula: 'Σ exposure_amount',
          description: t('Sum of the gross exposure amount.', 'Suma del importe bruto de exposición.') },
        { name: t('Exposure at default', 'Exposición en default'), formula: 'Σ ead_amount',
          description: t('Sum of EAD of the filtered records.', 'Suma del EAD de los registros filtrados.') },
        { name: t('Average PD', 'PD media'), formula: 'Σ pd / N',
          description: t('Simple (unweighted) average of the probability of default.', 'Media simple (no ponderada) de la probabilidad de default.') },
        { name: t('Average LGD', 'LGD media'), formula: 'Σ lgd / N',
          description: t('Simple (unweighted) average of the loss given default.', 'Media simple (no ponderada) de la severidad (LGD).') },
        { name: t('Defaults', 'Defaults'), formula: 'count(default_flag = true)',
          description: t('Number of defaulted exposures in the selection.', 'Número de exposiciones en default de la selección.') },
      ]
    },
    endpoints: [
      { method: 'GET', path: '/api/getRiskExposures/', role: 'Any authenticated user',
        description: t('Full exposure list, newest first; filtering is done in the browser.', 'Lista completa de exposiciones, más recientes primero; el filtrado se hace en el navegador.') },
    ]
  },

  // ==========================================================
  // UPLOAD DATA
  // ==========================================================
  {
    id: 'upload-data',
    group: GROUP_DATA,
    title: t('Upload Data', 'Upload Data'),
    icon: 'pi pi-upload',
    route: '/upload-data',
    summary: t(
      'Controlled ingestion of exposure files (CSV / XLSX) with column-by-column validation.',
      'Carga controlada de ficheros de exposiciones (CSV / XLSX) con validación columna a columna.'
    ),
    purpose: t(
      'Entry point of the data into risk_exposures. Each file is validated against the data contract before being stored: if a single row is invalid, nothing is inserted (all-or-nothing), so the master dataset never contains partial loads.',
      'Puerta de entrada de los datos a risk_exposures. Cada fichero se valida contra el contrato de datos antes de guardarse: si una sola fila no es válida, no se inserta nada (todo o nada), de modo que el dataset maestro nunca contiene cargas parciales.'
    ),
    steps: [
      t('Drag and drop a .csv or .xlsx file, select it from disk or use one of the demo files.',
        'Arrastra un fichero .csv o .xlsx, selecciónalo del disco o usa uno de los ficheros de demo.'),
      t('Check the file name and size, then click "Process File".',
        'Comprueba el nombre y el tamaño del fichero y pulsa "Procesar archivo".'),
      t('If the file is rejected, the message shows the row and the column that failed. Fix the file and upload it again.',
        'Si el fichero se rechaza, el mensaje indica la fila y la columna que fallan. Corrige el fichero y vuelve a subirlo.'),
      t('The demo files include valid examples and others with intentional errors (ES, PE and CO datasets).',
        'Los ficheros de demo incluyen ejemplos válidos y otros con errores intencionados (datasets de ES, PE y CO).'),
    ],
    rules: {
      title: t('Validation rules', 'Reglas de validación'),
      rows: [
        { name: t('File format', 'Formato'), formula: 'extension ∈ {.csv, .xlsx}',
          description: t('Any other format is rejected.', 'Cualquier otro formato se rechaza.') },
        { name: t('Mandatory columns', 'Columnas obligatorias'), formula: 'header ⊇ 16 contract columns',
          description: t('The header must contain every column of the data dictionary; the response lists the missing ones.', 'La cabecera debe contener todas las columnas del diccionario de datos; la respuesta indica las que faltan.') },
        { name: t('Required values', 'Valores obligatorios'), formula: 'value ≠ empty (except rating, default_date, data_source)',
          description: t('Empty, "nan", "null" or "none" are treated as empty.', 'Vacío, "nan", "null" o "none" se consideran vacíos.') },
        { name: t('Amounts', 'Importes'), formula: 'NUMERIC(18,2) → |x| < 10^16',
          description: t('exposure_amount and ead_amount: valid decimal numbers, rounded to 2 decimals.', 'exposure_amount y ead_amount: números decimales válidos, redondeados a 2 decimales.') },
        { name: t('Risk parameters', 'Parámetros de riesgo'), formula: 'NUMERIC(8,6) → |x| < 100',
          description: t('pd and lgd: valid numbers with 6 decimals. The 0–1 range is checked later in Data Quality.', 'pd y lgd: números válidos con 6 decimales. El rango 0–1 se comprueba después en Data Quality.') },
        { name: t('Dates', 'Fechas'), formula: 'format YYYY-MM-DD',
          description: t('Applies to reporting_date and default_date.', 'Aplica a reporting_date y default_date.') },
        { name: t('Booleans', 'Booleanos'), formula: 'true|t|yes|y|1  ·  false|f|no|n|0',
          description: t('Accepted values for default_flag (case-insensitive).', 'Valores aceptados para default_flag (sin distinguir mayúsculas).') },
        { name: t('Text length', 'Longitud de texto'), formula: 'len(value) ≤ max length',
          description: t('For example country = 2 characters, currency = 3. See the data dictionary.', 'Por ejemplo country = 2 caracteres, currency = 3. Ver el diccionario de datos.') },
        { name: t('Atomic load', 'Carga atómica'), formula: 'any invalid row ⇒ 0 records inserted',
          description: t('The whole file is rejected if a single row fails.', 'Todo el fichero se rechaza si falla una sola fila.') },
      ]
    },
    persistence: [
      t('Valid rows are appended to risk_exposures with created_at and updated_at; the country is stored in upper case.',
        'Las filas válidas se añaden a risk_exposures con created_at y updated_at; el país se guarda en mayúsculas.'),
      t('An UPLOAD entry is written to audit_log with the number of records inserted.',
        'Se registra una entrada UPLOAD en audit_log con el número de registros insertados.'),
    ],
    endpoints: [
      { method: 'POST', path: '/api/uploadData/', role: 'DataAdmin',
        description: t('Multipart upload (field "file"). Returns recordsInserted or the validation error.', 'Subida multipart (campo "file"). Devuelve recordsInserted o el error de validación.') },
    ],
    blocks: [
      {
        title: t('Permissions', 'Permisos'),
        items: [
          t('Only the DataAdmin role can process files. Analyst users see the screen in read-only mode.',
            'Solo el rol DataAdmin puede procesar ficheros. Los usuarios Analyst ven la pantalla en modo solo lectura.'),
        ]
      }
    ]
  },

  // ==========================================================
  // HOUSEKEEPING
  // ==========================================================
  {
    id: 'housekeeping',
    group: GROUP_DATA,
    title: t('Housekeeping', 'Housekeeping'),
    icon: 'pi pi-database',
    route: '/housekeeping',
    summary: t(
      'Search, review and delete exposure records under audit control.',
      'Búsqueda, revisión y borrado de registros de exposición con control de auditoría.'
    ),
    purpose: t(
      'Maintenance screen of the master dataset. It is used to remove duplicated or incorrect records (for example a wrong load) before reloading the corrected file.',
      'Pantalla de mantenimiento del dataset maestro. Se usa para eliminar registros duplicados o incorrectos (por ejemplo una carga errónea) antes de volver a cargar el fichero corregido.'
    ),
    steps: [
      t('Filter by reporting date, country, portfolio, product type, risk stage, rating, data source or default flag.',
        'Filtra por fecha de reporte, país, cartera, tipo de producto, risk stage, rating, origen del dato o flag de default.'),
      t('Entity ID and entity name accept partial text (case-insensitive).',
        'Entity ID y nombre de entidad admiten texto parcial (sin distinguir mayúsculas).'),
      t('Select the records to remove and click "Delete". A confirmation is requested before deleting.',
        'Selecciona los registros a eliminar y pulsa "Eliminar". Se pide confirmación antes de borrar.'),
    ],
    rules: {
      title: t('Search logic', 'Lógica de búsqueda'),
      rows: [
        { name: t('Exact filters', 'Filtros exactos'), formula: 'field = value',
          description: t('reporting_date, country, portfolio, product_type, risk_stage, rating, data_source.', 'reporting_date, country, portfolio, product_type, risk_stage, rating, data_source.') },
        { name: t('Partial filters', 'Filtros parciales'), formula: 'lower(field) contains lower(text)',
          description: t('entity_id and entity_name.', 'entity_id y entity_name.') },
        { name: t('Default filter', 'Filtro de default'), formula: 'default_flag = true | false',
          description: t('Optional; empty means both.', 'Opcional; vacío significa ambos.') },
        { name: t('Sort order', 'Orden'), formula: 'id DESC, reporting_date DESC, entity_id DESC',
          description: t('Newest records first.', 'Registros más recientes primero.') },
      ]
    },
    persistence: [
      t('Deleted records are removed from risk_exposures (no soft delete).',
        'Los registros eliminados se borran de risk_exposures (sin borrado lógico).'),
      t('A DELETE entry is written to audit_log with the number of records and their IDs.',
        'Se registra una entrada DELETE en audit_log con el número de registros y sus IDs.'),
    ],
    endpoints: [
      { method: 'GET', path: '/api/housekeeping/', role: 'Any authenticated user',
        description: t('Search with query parameters; also returns the values available for each filter.', 'Búsqueda por parámetros; devuelve también los valores disponibles de cada filtro.') },
      { method: 'DELETE', path: '/api/housekeeping/', role: 'DataAdmin',
        description: t('Body {"ids": [..]}. Returns recordsDeleted.', 'Cuerpo {"ids": [..]}. Devuelve recordsDeleted.') },
    ]
  },

  // ==========================================================
  // DATA QUALITY
  // ==========================================================
  {
    id: 'data-quality',
    group: GROUP_GOVERNANCE,
    title: t('Data Quality', 'Data Quality'),
    icon: 'pi pi-check-circle',
    route: '/data-quality',
    summary: t(
      'Business-rule controls that certify a dataset (country + reporting date) before reporting.',
      'Controles de reglas de negocio que certifican un dataset (país + fecha de reporte) antes del reporting.'
    ),
    purpose: t(
      'Answers the question "is this data valid, complete and consistent?". It does not calculate risk metrics: it certifies the input of Audit Reporting. A report is only considered validated when the latest Data Quality run of its dataset has no failed checks.',
      'Responde a la pregunta "¿estos datos son válidos, completos y coherentes?". No calcula métricas de riesgo: certifica la entrada de Audit Reporting. Un informe solo se considera validado cuando la última ejecución de Data Quality de su dataset no tiene controles fallidos.'
    ),
    steps: [
      t('Select the country and the reporting date of the dataset.',
        'Selecciona el país y la fecha de reporte del dataset.'),
      t('Run the controls. Each check shows PASSED/FAILED, the records checked and the records failed.',
        'Ejecuta los controles. Cada uno muestra PASSED/FAILED, los registros revisados y los registros fallidos.'),
      t('If a check fails, review the data in Data Explorer, fix it (Housekeeping + Upload Data) and run the controls again.',
        'Si un control falla, revisa los datos en Data Explorer, corrígelos (Housekeeping + Upload Data) y vuelve a ejecutar los controles.'),
    ],
    rules: {
      title: t('Quality controls', 'Controles de calidad'),
      rows: [
        { name: t('Missing Entity ID', 'Entity ID vacío'), formula: 'fail if entity_id is blank',
          description: t('Every exposure must be linked to an entity.', 'Toda exposición debe estar asociada a una entidad.') },
        { name: t('Invalid PD', 'PD no válida'), formula: 'fail if pd is null or pd < 0 or pd > 1',
          description: t('The probability of default must be a probability.', 'La probabilidad de default debe ser una probabilidad.') },
        { name: t('Invalid LGD', 'LGD no válida'), formula: 'fail if lgd is null or lgd < 0 or lgd > 1',
          description: t('The loss given default must be between 0% and 100%.', 'La severidad debe estar entre 0% y 100%.') },
        { name: t('Default Consistency', 'Coherencia del default'), formula: '(flag = true ∧ date empty) ∨ (flag = false ∧ date filled) ⇒ fail',
          description: t('A defaulted exposure needs a default date and a performing one must not have it.', 'Una exposición en default necesita fecha de default y una sana no debe tenerla.') },
        { name: t('EAD Greater Than Exposure', 'EAD mayor que la exposición'), formula: 'fail if ead_amount > exposure_amount',
          description: t('Exposure at default cannot exceed the total exposure.', 'La exposición en default no puede superar la exposición total.') },
        { name: t('Check status', 'Estado del control'), formula: 'PASSED if records_failed = 0, else FAILED',
          description: t('Evaluated over all the records of the dataset.', 'Se evalúa sobre todos los registros del dataset.') },
        { name: t('Quality score', 'Quality score'), formula: 'checks passed / checks executed × 100',
          description: t('Percentage of controls passed (5 controls → steps of 20%).', 'Porcentaje de controles superados (5 controles → saltos del 20%).') },
      ]
    },
    persistence: [
      t('Results are stored in data_quality_results; a new run replaces the previous run of the same country + date.',
        'Los resultados se guardan en data_quality_results; una nueva ejecución sustituye a la anterior del mismo país + fecha.'),
      t('A DATA_QUALITY entry is written to audit_log.',
        'Se registra una entrada DATA_QUALITY en audit_log.'),
    ],
    endpoints: [
      { method: 'GET', path: '/api/dataQuality/', role: 'Any authenticated user',
        description: t('Available datasets: countries and their reporting dates.', 'Datasets disponibles: países y sus fechas de reporte.') },
      { method: 'POST', path: '/api/dataQuality/', role: 'Any authenticated user',
        description: t('Body {"country", "reporting_date"}. Runs the controls and returns the summary and the results.', 'Cuerpo {"country", "reporting_date"}. Ejecuta los controles y devuelve el resumen y los resultados.') },
    ]
  },

  // ==========================================================
  // AUDIT REPORTING
  // ==========================================================
  {
    id: 'audit-reporting',
    group: GROUP_GOVERNANCE,
    title: t('Audit Reporting', 'Audit Reporting'),
    icon: 'pi pi-chart-bar',
    route: '/audit-reporting',
    summary: t(
      'Calculation of credit risk metrics over a configurable reporting universe, with history and PDF export.',
      'Cálculo de métricas de riesgo de crédito sobre un universo de reporting configurable, con histórico y exportación a PDF.'
    ),
    purpose: t(
      'Turns the validated dataset into risk information. The user defines the reporting universe (country and date are mandatory; portfolio, product, stage, rating and default status are optional), calculates the metrics and keeps them in the reporting history.',
      'Convierte el dataset validado en información de riesgo. El usuario define el universo de reporting (país y fecha obligatorios; cartera, producto, stage, rating y estado de default opcionales), calcula las métricas y las conserva en el histórico de reporting.'
    ),
    steps: [
      t('Enter a report name and select the reporting date and the country. Optional filters narrow the universe.',
        'Introduce un nombre de informe y selecciona la fecha de reporte y el país. Los filtros opcionales acotan el universo.'),
      t('Each filter only shows values compatible with the others, so empty universes are avoided.',
        'Cada filtro solo muestra valores compatibles con el resto, para evitar universos vacíos.'),
      t('Click "Calculate Metrics". If Data Quality has not passed for that dataset, the report is flagged as not validated.',
        'Pulsa "Calcular métricas". Si Data Quality no ha pasado para ese dataset, el informe se marca como no validado.'),
      t('Export the filtered records to CSV or generate the PDF report.',
        'Exporta los registros filtrados a CSV o genera el informe en PDF.'),
    ],
    rules: {
      title: t('Risk metrics (N = records in the reporting universe)', 'Métricas de riesgo (N = registros del universo de reporting)'),
      rows: [
        { name: t('Exposure Count', 'Número de exposiciones'), formula: 'N',
          description: t('Number of exposures in the selected universe.', 'Número de exposiciones del universo seleccionado.') },
        { name: t('Total Exposure', 'Exposición total'), formula: 'Σ exposure_amount',
          description: t('Gross exposure, rounded to 2 decimals.', 'Exposición bruta, redondeada a 2 decimales.') },
        { name: t('Total EAD', 'EAD total'), formula: 'Σ ead_amount',
          description: t('Exposure at default, rounded to 2 decimals.', 'Exposición en default, redondeada a 2 decimales.') },
        { name: t('Average PD', 'PD media'), formula: 'Σ pd / N',
          description: t('Simple average of the probability of default.', 'Media simple de la probabilidad de default.') },
        { name: t('Average LGD', 'LGD media'), formula: 'Σ lgd / N',
          description: t('Simple average of the loss given default.', 'Media simple de la severidad.') },
        { name: t('Default Rate', 'Tasa de default'), formula: 'count(default_flag = true) / N',
          description: t('Share of defaulted exposures.', 'Proporción de exposiciones en default.') },
        { name: t('Expected Loss', 'Pérdida esperada'), formula: 'EL = Σ (EAD_i × PD_i × LGD_i)',
          description: t('Expected loss calculated exposure by exposure and then aggregated.', 'Pérdida esperada calculada exposición a exposición y después agregada.') },
        { name: t('Report validation', 'Validación del informe'), formula: 'DQ PASSED ⇒ validated · DQ FAILED or not run ⇒ not validated',
          description: t('Uses the latest Data Quality run of the same country + reporting date.', 'Usa la última ejecución de Data Quality del mismo país + fecha de reporte.') },
      ]
    },
    persistence: [
      t('Each calculation stores one row per metric in reporting_results (universe filters, records analysed and execution date).',
        'Cada cálculo guarda una fila por métrica en reporting_results (filtros del universo, registros analizados y fecha de ejecución).'),
      t('Recalculating a report with the same name + date + country replaces its previous version.',
        'Recalcular un informe con el mismo nombre + fecha + país sustituye su versión anterior.'),
      t('A REPORT entry is written to audit_log, stating whether the report is validated.',
        'Se registra una entrada REPORT en audit_log, indicando si el informe está validado.'),
    ],
    endpoints: [
      { method: 'GET', path: '/api/reporting/?action=filters', role: 'Any authenticated user',
        description: t('Values available for each filter, given the current selection.', 'Valores disponibles de cada filtro según la selección actual.') },
      { method: 'GET', path: '/api/reporting/?action=export', role: 'Any authenticated user',
        description: t('CSV with the records of the universe (filtered_exposures.csv).', 'CSV con los registros del universo (filtered_exposures.csv).') },
      { method: 'GET', path: '/api/reporting/', role: 'Any authenticated user',
        description: t('Reporting history; optional filters report_name, reporting_date and country.', 'Histórico de reporting; filtros opcionales report_name, reporting_date y country.') },
      { method: 'POST', path: '/api/reporting/', role: 'Any authenticated user',
        description: t('Calculates and stores the metrics of the universe.', 'Calcula y guarda las métricas del universo.') },
    ]
  },

  // ==========================================================
  // DATA DICTIONARY
  // ==========================================================
  {
    id: 'data-dictionary',
    group: GROUP_REFERENCE,
    title: t('Data dictionary', 'Diccionario de datos'),
    icon: 'pi pi-table',
    summary: t(
      'Data contract of risk_exposures: the 16 columns every uploaded file must contain.',
      'Contrato de datos de risk_exposures: las 16 columnas que debe contener todo fichero cargado.'
    ),
    purpose: t(
      'Reference for data providers and analysts. Types and lengths are enforced by Upload Data; business ranges are enforced by Data Quality.',
      'Referencia para proveedores de datos y analistas. Los tipos y longitudes los aplica Upload Data; los rangos de negocio los aplica Data Quality.'
    ),
    fields: {
      title: t('risk_exposures', 'risk_exposures'),
      rows: [
        { name: 'reporting_date', type: 'DATE (YYYY-MM-DD)', required: true, description: t('Reference date of the data (month end).', 'Fecha de referencia de los datos (cierre de mes).') },
        { name: 'entity_id', type: 'TEXT(50)', required: true, description: t('Identifier of the counterparty, e.g. ENT-ES-0301.', 'Identificador de la contraparte, p. ej. ENT-ES-0301.') },
        { name: 'entity_name', type: 'TEXT(255)', required: true, description: t('Name of the counterparty.', 'Nombre de la contraparte.') },
        { name: 'country', type: 'TEXT(2)', required: true, description: t('ISO 3166-1 alpha-2 country code (ES, PE, CO…). Stored in upper case.', 'Código de país ISO 3166-1 alfa-2 (ES, PE, CO…). Se guarda en mayúsculas.') },
        { name: 'portfolio', type: 'TEXT(50)', required: true, description: t('Business segment: CORPORATE, SME, RETAIL.', 'Segmento de negocio: CORPORATE, SME, RETAIL.') },
        { name: 'product_type', type: 'TEXT(50)', required: true, description: t('Product: LOAN, MORTGAGE, CREDIT_LINE.', 'Producto: LOAN, MORTGAGE, CREDIT_LINE.') },
        { name: 'exposure_amount', type: 'NUMERIC(18,2)', required: true, description: t('Gross exposure amount in the record currency.', 'Importe bruto de exposición en la divisa del registro.') },
        { name: 'ead_amount', type: 'NUMERIC(18,2)', required: true, description: t('Exposure at Default (EAD). Must not exceed exposure_amount.', 'Exposure at Default (EAD). No debe superar exposure_amount.') },
        { name: 'pd', type: 'NUMERIC(8,6)', required: true, description: t('Probability of Default, 0–1 (0.0235 = 2.35%).', 'Probabilidad de default, 0–1 (0,0235 = 2,35%).') },
        { name: 'lgd', type: 'NUMERIC(8,6)', required: true, description: t('Loss Given Default, 0–1 (0.40 = 40%).', 'Severidad (Loss Given Default), 0–1 (0,40 = 40%).') },
        { name: 'risk_stage', type: 'TEXT(20)', required: true, description: t('IFRS 9 stage: STAGE_1 (performing), STAGE_2 (significant increase in credit risk), STAGE_3 (credit-impaired).', 'Stage IFRS 9: STAGE_1 (normal), STAGE_2 (incremento significativo del riesgo), STAGE_3 (deteriorado).') },
        { name: 'rating', type: 'TEXT(10)', required: false, description: t('Credit rating (AA, A, BBB, BB…).', 'Rating crediticio (AA, A, BBB, BB…).') },
        { name: 'default_flag', type: 'BOOLEAN', required: true, description: t('true if the exposure is in default.', 'true si la exposición está en default.') },
        { name: 'default_date', type: 'DATE (YYYY-MM-DD)', required: false, description: t('Date of default. Expected when default_flag = true (checked in Data Quality).', 'Fecha de default. Esperada si default_flag = true (se comprueba en Data Quality).') },
        { name: 'currency', type: 'TEXT(3)', required: true, description: t('ISO 4217 currency code (EUR, PEN, COP…).', 'Código de divisa ISO 4217 (EUR, PEN, COP…).') },
        { name: 'data_source', type: 'TEXT(100)', required: false, description: t('Source system: CORE_BANKING, RISK_ENGINE…', 'Sistema origen: CORE_BANKING, RISK_ENGINE…') },
      ]
    },
    blocks: [
      {
        title: t('System columns', 'Columnas de sistema'),
        items: [
          t('id: incremental identifier assigned on insert.', 'id: identificador incremental asignado al insertar.'),
          t('created_at / updated_at: timestamp of the load.', 'created_at / updated_at: fecha y hora de la carga.'),
        ]
      },
      {
        title: t('Other stores', 'Otros almacenes'),
        items: [
          t('data_quality_results: one row per control and run (status, records checked and failed, details).', 'data_quality_results: una fila por control y ejecución (estado, registros revisados y fallidos, detalle).'),
          t('reporting_results: one row per metric and report (value, universe filters, records analysed).', 'reporting_results: una fila por métrica e informe (valor, filtros del universo, registros analizados).'),
          t('audit_log: action (UPLOAD, DELETE, DATA_QUALITY, REPORT), table, records affected, date and details.', 'audit_log: acción (UPLOAD, DELETE, DATA_QUALITY, REPORT), tabla, registros afectados, fecha y detalle.'),
        ]
      }
    ]
  },

  // ==========================================================
  // SECURITY & ACCESS
  // ==========================================================
  {
    id: 'security',
    group: GROUP_REFERENCE,
    title: t('Security & access', 'Seguridad y acceso'),
    icon: 'pi pi-shield',
    summary: t(
      'JWT authentication, Microsoft Entra ID single sign-on and role-based access control.',
      'Autenticación JWT, inicio de sesión único con Microsoft Entra ID y control de acceso por roles.'
    ),
    purpose: t(
      'Every API endpoint, except the login, requires a valid token. Permissions are always enforced by the backend; the interface only adapts to the role of the user.',
      'Todos los endpoints de la API, salvo el login, requieren un token válido. Los permisos los aplica siempre el backend; la interfaz solo se adapta al rol del usuario.'
    ),
    steps: [
      t('Demo access: user and password validated by the backend, which issues a JWT (HS256) valid for 60 minutes.',
        'Acceso demo: usuario y contraseña validados por el backend, que emite un JWT (HS256) válido 60 minutos.'),
      t('Sign in with Microsoft: OAuth 2.0 Authorization Code + PKCE with Microsoft Entra ID; any Microsoft account can sign in.',
        'Iniciar sesión con Microsoft: OAuth 2.0 Authorization Code + PKCE con Microsoft Entra ID; puede entrar cualquier cuenta de Microsoft.'),
      t('An HTTP interceptor sends the token in the Authorization: Bearer header. It is kept in sessionStorage and cleared when the tab is closed.',
        'Un interceptor HTTP envía el token en la cabecera Authorization: Bearer. Se guarda en sessionStorage y se borra al cerrar la pestaña.'),
      t('An expired or invalid token returns 401 and the session is closed automatically.',
        'Un token caducado o no válido devuelve 401 y la sesión se cierra automáticamente.'),
    ],
    rules: {
      title: t('Roles and token validation', 'Roles y validación de tokens'),
      rows: [
        { name: t('DataAdmin', 'DataAdmin'), formula: 'read + upload + delete',
          description: t('Demo user and users of the own Entra ID tenant with the DataAdmin app role.', 'Usuario demo y usuarios del tenant propio de Entra ID con el rol DataAdmin.') },
        { name: t('Analyst', 'Analyst'), formula: 'read only (403 on writes)',
          description: t('Any other Microsoft account. Upload and delete actions are disabled.', 'Cualquier otra cuenta de Microsoft. Las acciones de subida y borrado están deshabilitadas.') },
        { name: t('Demo token', 'Token demo'), formula: 'HS256 · iss · aud · exp · nbf',
          description: t('Signed with the server secret; the algorithm list is fixed to prevent "alg: none" attacks.', 'Firmado con el secreto del servidor; la lista de algoritmos es fija para evitar ataques "alg: none".') },
        { name: t('Microsoft token', 'Token de Microsoft'), formula: 'RS256 · JWKS · aud = client_id · iss = login.microsoftonline.com/{tid}/v2.0',
          description: t('Verified with the Microsoft public keys (cached).', 'Verificado con las claves públicas de Microsoft (en caché).') },
        { name: t('Cross-tenant roles', 'Roles de otros tenants'), formula: 'DataAdmin ⇔ tid = own tenant ∧ role assigned',
          description: t('Roles assigned by another organisation are ignored.', 'Se ignoran los roles asignados por otra organización.') },
        { name: t('Brute-force protection', 'Protección contra fuerza bruta'), formula: '10 login attempts / minute → 429',
          description: t('Credentials are compared in constant time.', 'Las credenciales se comparan en tiempo constante.') },
      ]
    },
    endpoints: [
      { method: 'POST', path: '/api/auth/login/', role: 'Public',
        description: t('Body {"username", "password"}. Returns access_token, expires_in and role.', 'Cuerpo {"username", "password"}. Devuelve access_token, expires_in y role.') },
    ],
    blocks: [
      {
        title: t('Hardening', 'Bastionado'),
        items: [
          t('CORS with an explicit allow-list and no credentials; in production web and API share the domain.', 'CORS con lista blanca explícita y sin credenciales; en producción la web y la API comparten dominio.'),
          t('Security headers: X-Frame-Options DENY, nosniff, Referrer-Policy and configurable HSTS.', 'Cabeceras de seguridad: X-Frame-Options DENY, nosniff, Referrer-Policy y HSTS configurable.'),
          t('DEBUG disabled by default and secrets read from environment variables.', 'DEBUG desactivado por defecto y secretos leídos de variables de entorno.'),
        ]
      }
    ]
  },
];
