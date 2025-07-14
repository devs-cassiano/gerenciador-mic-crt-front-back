# Sistema de Gestão de Transportadoras e Documentos

## MIC/DTA com Tipos NORMAL e LASTRE ✅

### Tipos de MIC/DTA

#### 1. **NORMAL** (Padrão)
- Relacionado obrigatoriamente a um CRT
- Herda todas as informações do CRT
- Para caminhões com carga e documentação completa

#### 2. **LASTRE** (Novo)
- Independente de CRT
- Para caminhões sem carga (vazios)
- Apenas número e data necessários

## Exemplos de Uso

### MIC/DTA NORMAL (comportamento anterior)
```json
{
  "tipo": "NORMAL",
  "crtId": 1,
  "quantidade": 3
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "micDtas": [
      {
        "id": 1,
        "numero": "BR602300001",
        "tipo": "NORMAL",
        "paisOrigemCodigo": "BR",
        "paisDestinoCodigo": "PY",
        "licencaComplementar": "6023",
        "numeroSequencial": 1,
        "crtId": 1,
        "transportadoraId": 1,
        "dataCriacao": "11/07/2025"
      }
    ],
    "tipo": "NORMAL",
    "herdadoDoCrt": {
      "numero": "BR602300001",
      "paisOrigem": "BR",
      "paisDestino": "PY",
      "licenca": "6023"
    }
  },
  "message": "3 MIC/DTA(s) NORMAL criado(s) com sucesso, herdando dados do CRT BR602300001"
}
```

### MIC/DTA LASTRE (novo)
```json
{
  "tipo": "LASTRE",
  "transportadoraId": 1,
  "paisOrigemCodigo": "BR",
  "paisDestinoCodigo": "PY",
  "quantidade": 2
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "micDtas": [
      {
        "id": 2,
        "numero": "BR602300002",
        "tipo": "LASTRE",
        "paisOrigemCodigo": "BR",
        "paisDestinoCodigo": "PY",
        "licencaComplementar": "6023",
        "numeroSequencial": 2,
        "crtId": null,
        "transportadoraId": 1,
        "dataCriacao": "11/07/2025"
      }
    ],
    "tipo": "LASTRE",
    "configuracao": {
      "transportadora": "Transportes ABC",
      "paisOrigem": "BR",
      "paisDestino": "PY",
      "licenca": "6023",
      "observacao": "MIC/DTA LASTRE - Caminhão sem carga"
    }
  },
  "message": "2 MIC/DTA(s) LASTRE criado(s) com sucesso para Transportes ABC"
}
```

## Campos Obrigatórios

### Para MIC/DTA NORMAL:
- `tipo`: "NORMAL"
- `crtId`: ID do CRT relacionado
- `quantidade`: Número de documentos (opcional, padrão 1)

### Para MIC/DTA LASTRE:
- `tipo`: "LASTRE"
- `transportadoraId`: ID da transportadora
- `paisDestinoCodigo`: País de destino
- `paisOrigemCodigo`: País de origem (opcional, usa país da transportadora)
- `quantidade`: Número de documentos (opcional, padrão 1)

## Numeração Sequencial

Ambos os tipos usam a mesma sequência de numeração baseada em:
- Transportadora
- País origem
- País destino  
- Licença complementar

**Exemplo de sequência unificada:**
1. CRT: `BR602300001`
2. MIC/DTA NORMAL: `BR602300002`
3. MIC/DTA LASTRE: `BR602300003`
4. MIC/DTA NORMAL: `BR602300004`

## Endpoints

### POST /api/mic-dta
Criar MIC/DTA (NORMAL ou LASTRE)

### GET /api/mic-dta
Listar todos os MIC/DTAs

### GET /api/mic-dta/tipo/:tipo
Listar MIC/DTAs por tipo (NORMAL ou LASTRE)

### GET /api/mic-dta/transportadora/:transportadoraId
Listar MIC/DTAs de uma transportadora

### GET /api/mic-dta/crt/:crtId
Listar MIC/DTAs relacionados a um CRT (apenas NORMAL)

## Casos de Uso

### NORMAL
- ✅ Caminhão com carga
- ✅ Documentação completa
- ✅ CRT obrigatório
- ✅ Herda país origem/destino e licença do CRT

### LASTRE  
- ✅ Caminhão vazio (sem carga)
- ✅ Apenas trânsito/retorno
- ✅ Não precisa de CRT
- ✅ Configura diretamente origem/destino
- ✅ Busca licença da transportadora

## Regras de Negócio

1. **NORMAL**: CRT obrigatório, herda todas as informações
2. **LASTRE**: Independente, requer transportadora e destino
3. **Numeração**: Sequência única por transportadora/origem/destino/licença
4. **Validações**: Transportadora deve ter licença para o destino
5. **Data**: Criação automática com data atual
6. **Consistency**: Ambos tipos seguem mesmo padrão de numeração