# Banking Data Platform

## Overview

La **Banking Data Platform** es una plataforma orientada a la gestión, validación y explotación de datos de riesgo.

La aplicación sigue un flujo sencillo:

                         BANKING DATA PLATFORM  
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   UPLOAD DATA   │
                         └────────┬────────┘
                                  │
                                  ▼
                           risk_exposures
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
             ┌──────────────┐           ┌──────────────┐
             │ DATA QUALITY │           │  HOUSEKEEPING│
             └──────┬───────┘           └───────┬──────┘
                    │                           │
                    │ Validación                │ Gestión /
                    │                           │ eliminación
                    ▼                           │
             ┌──────────────┐                   │
             │   REPORTING  │                   │
             └──────┬───────┘                   │
                    │                           │
                    ▼                           │
              Risk Metrics                      │
                                                │
                                                └──────────────►
                                                       UPLOAD DATA


La idea principal es separar claramente tres etapas:

1. Upload Data → introducir y gestionar los datos.
2. Data Quality → comprobar que los datos son válidos y coherentes.
3. Reporting → utilizar los datos para calcular métricas de riesgo.


---

# 1. Upload Data

## Objetivo

Upload Data es la puerta de entrada de información a la plataforma.

Desde esta sección se pueden subir ficheros CSV con información de exposiciones de riesgo. Los datos se almacenan en la tabla principal:

risk_exposures

Cada dataset queda identificado fundamentalmente por:

- Country
- Reporting date
- Año y mes derivados de la fecha cuando corresponde
- Los diferentes campos propios de cada exposición

Entre estos campos se encuentran, por ejemplo:

- entity_id
- pd
- lgd
- ead_amount
- exposure_amount
- default_flag
- default_date
- portfolio
- product_type
- risk_stage
- rating

## Gestión de datasets

La plataforma no se limita a subir información.

También permite gestionar los datasets existentes:

- Subir nuevos ficheros.
- Actualizar o reemplazar información.
- Eliminar datasets cuando sea necesario.

De esta forma, risk_exposures actúa como el master dataset sobre el que trabajan las siguientes fases de la aplicación.


---

# 2. Data Quality

## Objetivo

Data Quality es la capa de validación de la información.

La pregunta que responde esta sección es:

"¿Los datos que voy a utilizar para reporting son válidos, completos y coherentes?"

Para ejecutar los controles se selecciona un dataset mediante:

- Country
- Reporting date

Por ejemplo:

Country: Spain
Reporting date: 30/06/2026

Una vez seleccionado el dataset, se ejecutan las reglas de calidad.

## Controles actuales

Actualmente la plataforma dispone de controles como:

| Control | Qué comprueba |
|---|---|
| Missing Entity ID | Que todas las exposiciones tengan un identificador válido |
| Invalid PD | Que PD esté entre 0 y 1 |
| Invalid LGD | Que LGD esté entre 0 y 1 |
| Default Consistency | Que default_flag y default_date sean coherentes |
| EAD Greater Than Exposure | Que EAD no sea superior a la exposición |

## Resultado de Data Quality

Los controles producen un resumen como:

Records analysed     5
Checks executed      5
Checks passed        5
Checks failed        0
Quality score        100%

Además de mostrar los resultados en pantalla, la ejecución queda persistida en:

data_quality_results

Esto permite mantener un registro de las validaciones realizadas.

## Concepto clave

Data Quality es, por tanto, la capa de control y validación de la plataforma.

Su función no es calcular métricas de riesgo, sino comprobar que la información utilizada posteriormente es consistente.


---

# 3. Reporting

## Objetivo

Una vez seleccionado un dataset, la sección Reporting utiliza esa información para calcular diferentes métricas de riesgo.

Por ejemplo:

Report: ddf
Country: Spain
Reporting date: 30/06/2026

A partir del universo seleccionado se calculan métricas como:

- Exposure Count
- Total Exposure
- Total EAD
- Average PD
- Average LGD
- Default Rate
- Expected Loss

## Ejemplo de resultado

Para un determinado dataset podríamos obtener:

Exposure Count     5
Total Exposure     €5,645,000.00
Total EAD          €5,375,000.00
Average PD         2.57%
Average LGD        35.40%
Default Rate       0.00%
Expected Loss      €61,630.83

Estas métricas representan la información agregada del universo de exposiciones seleccionado.


---

# 4. Data Quality vs Reporting

Esta es una de las partes más importantes de la arquitectura.

Data Quality y Reporting no tienen la misma función.

## Data Quality responde:

"¿Los datos son válidos?"

Por ejemplo:

PD válido
LGD válido
Entity ID existente
Default consistente
EAD <= Exposure

        ↓

     PASSED


## Reporting responde:

"¿Qué dicen esos datos?"

Por ejemplo:

PD medio
LGD medio
EAD total
Exposure total
Default rate
Expected Loss

        ↓

    RESULTADOS


Por tanto:

| Capa | Pregunta | Resultado |
| ---|---|---|
| Upload Data | ¿Qué datos tenemos? | Dataset maestro |
| Data Quality | ¿Son válidos y coherentes? | PASSED / FAILED |
| Reporting | ¿Qué información de riesgo contienen? | Risk Metrics |

Las métricas de Reporting no determinan por sí mismas que los datos sean correctos.

Por ejemplo, que la aplicación calcule correctamente:

Average PD = 2.57%

no significa que todos los valores de PD utilizados fueran válidos.

La validación de esos valores corresponde a Data Quality.


---

# 5. Reporting y Data Quality

Reporting también incorpora la información de Data Quality para que el resultado final tenga contexto sobre la calidad del dataset utilizado.

De esta forma, un reporte no solo muestra:

- Expected Loss
- Average PD
- Average LGD
- Total EAD
- Total Exposure
- Default Rate

sino también información como:

- Data Quality Status
- Records analysed
- Checks executed
- Checks passed
- Checks failed
- Quality score

Esto permite interpretar las métricas dentro del contexto de la calidad de los datos utilizados para calcularlas.


---

# 6. Housekeeping

La sección Housekeeping está orientada a la gestión y mantenimiento de la información almacenada en la plataforma.

Mientras que:

- Upload Data introduce o actualiza información.
- Data Quality valida la información.
- Reporting calcula métricas.

Housekeeping se encarga de las tareas relacionadas con el mantenimiento del entorno de datos.


---

# 7. Flujo completo de la aplicación

El flujo funcional completo puede resumirse así:


┌─────────────────────┐
│     UPLOAD DATA     │
│                     │
│ Upload / Update /   │
│ Delete CSV datasets │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   risk_exposures    │
│                     │
│   Master Dataset    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    DATA QUALITY     │
│                     │
│ Validate dataset    │
│                     │
│ ✓ Entity ID         │
│ ✓ PD                │
│ ✓ LGD               │
│ ✓ Default consistency│
│ ✓ EAD               │
└──────────┬──────────┘
           │
           │ Validated data
           ▼
┌─────────────────────┐
│      REPORTING      │
│                     │
│ Calculate risk      │
│ metrics             │
│                     │
│ • Exposure Count    │
│ • Total Exposure    │
│ • Total EAD         │
│ • Average PD        │
│ • Average LGD       │
│ • Default Rate      │
│ • Expected Loss     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    RISK REPORT      │
│                     │
│ Metrics + Data      │
│ Quality information │
└─────────────────────┘


---

# 8. Ejemplo de flujo real

## Paso 1 — Upload

Se sube un CSV correspondiente a:

Country: Spain
Reporting date: 30/06/2026

El fichero se carga en:

risk_exposures

con 5 exposiciones.

## Paso 2 — Data Quality

Se selecciona:

Spain
30/06/2026

Se ejecutan 5 controles:

Records analysed     5
Checks executed      5
Checks passed        5
Checks failed        0
Quality score        100%

El dataset queda validado.

## Paso 3 — Reporting

Se utiliza ese mismo universo para generar un reporte:

Report: prueba_report_ruiz
Spain
30/06/2026

Y se calculan:

Exposure Count     5
Total Exposure     €5,645,000.00
Total EAD          €5,375,000.00
Average PD         2.57%
Average LGD        35.40%
Default Rate       0.00%
Expected Loss      €61,630.83

## Paso 4 — Resultado final

El reporte final combina:

Dataset
   +
Data Quality
   +
Risk Metrics
   ↓
Final Risk Report

De esta manera, el usuario puede conocer tanto la calidad del dataset como las métricas de riesgo calculadas sobre él.


---

# 9. Arquitectura funcional

La plataforma puede entenderse como cuatro bloques principales:

                BANKING DATA PLATFORM  
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   DATA INGESTION   DATA GOVERNANCE   DATA ANALYSIS
        │                │                │
        ▼                ▼                ▼
   Upload Data       Data Quality      Reporting
        │                │                │
        │                ▼                │
        │            Housekeeping         │
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                    Risk Reporting


La arquitectura busca separar claramente:

- Ingesta de datos
- Gobierno y calidad
- Cálculo de métricas
- Generación de reporting

Esto permite que cada etapa tenga una responsabilidad concreta y que el flujo sea trazable.


---

# 10. Resumen

La aplicación sigue un principio sencillo:

"Primero introduzco los datos, después compruebo que son correctos y finalmente calculo información de negocio sobre ellos."

En términos funcionales:


UPLOAD
  ↓
¿QUÉ DATOS TENEMOS?
  ↓
DATA QUALITY
  ↓
¿SON VÁLIDOS?
  ↓
REPORTING
  ↓
¿QUÉ NOS DICEN?
  ↓
RISK METRICS


El objetivo final es disponer de una plataforma donde el proceso de:

INGESTA → VALIDACIÓN → ANÁLISIS → REPORTING

esté centralizado y sea trazable.


---

# 11. Producción HTTPS Gateway Procy Gunicorn 
python manage.py runserver 8001
Cliente → HTTPS → Gateway/Proxy → Gunicorn → Django → almacenamiento JSON (backend/data)