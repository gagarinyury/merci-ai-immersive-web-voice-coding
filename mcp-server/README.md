# IWSDK MCP Server

MCP сервер для интеграции Claude с IWSDK.

## Структура

```
mcp-server/
├── src/
│   ├── index.ts              # Entry point
│   ├── resources/
│   │   ├── types.ts          # iwsdk://types
│   │   ├── ecs.ts            # iwsdk://api/ecs
│   │   ├── entity.ts         # iwsdk://api/entity
│   │   ├── interactions.ts   # iwsdk://api/interactions
│   │   ├── three.ts          # iwsdk://api/three
│   │   └── examples.ts       # iwsdk://examples
│   └── tools/
│       ├── validate.ts       # validate_code
│       ├── hot-reload.ts     # hot_reload
│       └── list-scene.ts     # list_scene
└── package.json
```

## Resources (Claude читает)

| URI | Описание |
|-----|----------|
| `iwsdk://types` | TypeScript типы |
| `iwsdk://api/ecs` | createComponent, createSystem |
| `iwsdk://api/entity` | createTransformEntity, addComponent |
| `iwsdk://api/interactions` | Interactable, Grabbable |
| `iwsdk://api/three` | Mesh, Geometry, Material |
| `iwsdk://examples` | Примеры кода |

## Tools (Claude использует)

| Tool | Описание |
|------|----------|
| `validate_code` | Проверить код |
| `hot_reload` | Отправить в браузер |
| `list_scene` | Список объектов |

## Установка

```bash
cd mcp-server
npm install
npm run build
```

## Конфигурация Claude Desktop

```json
{
  "mcpServers": {
    "iwsdk": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

## TODO

- [ ] Заполнить resources реальной документацией
- [ ] Интегрировать с WebSocket сервером vrcreator2
- [ ] Добавить TypeScript валидацию
- [ ] Загружать .d.ts из @iwsdk/core
