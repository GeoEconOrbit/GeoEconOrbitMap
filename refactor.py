import re
with open("src/App.tsx", "r") as f:
    text = f.read()

text = text.replace("import { getShipIcon, getSatelliteIcon } from './lib/icons';", 
"import { getShipIcon, getSatelliteIcon } from './lib/icons';\nimport { renderStaticLayers } from './lib/mapStaticLayers';")

text = re.sub(
    r"  const renderStaticLayers = \(\) => \{.+?  };\n\n  const fetchNews = useCallback",
    "  const renderStaticLayersFn = () => {\n    renderStaticLayers(layersRef.current, iconTheme);\n  };\n\n  const fetchNews = useCallback",
    text,
    flags=re.DOTALL
)

text = text.replace("    renderStaticLayers();", "    renderStaticLayersFn();")

with open("src/App.tsx", "w") as f:
    f.write(text)
