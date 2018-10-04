import VectorIcon from './vector_icon'

const styles = {
  display: `
    display: flex;
    flex-direction: row;
  `,
  artboard: `
    display: flex;
    flex-direction: column;
    align-items: center;
  `,
  artboardTitle: `
    font-size: 12px;
  `,
  artboardGraphic: `
    border: solid 1px #bbb;
    display: flex;
  `
}

export default function getVectorArtboardDisplay(skiaIconSource) {
  const artboards = getSVGs(skiaIconSource)

  const displayOuter = document.createElement('div')
  const html = `<div style="${styles.display}">
  </div>`
  displayOuter.innerHTML = html
  const display = displayOuter.children[0]
  for (const artboard of artboards) {
    const artboardEl = document.createElement('div')
    artboardEl.setAttribute('style', styles.artboard)
    const artboardTitleEl = document.createElement('h5')
    artboardTitleEl.setAttribute('style', styles.artboardTitle)
    artboardTitleEl.textContent = artboard.size
    const artboardGraphicEl = document.createElement('div')
    artboardGraphicEl.setAttribute('style', styles.artboardGraphic)
    artboardGraphicEl.appendChild(artboard.svgElement)
    
    artboardEl.appendChild(artboardTitleEl)
    artboardEl.appendChild(artboardGraphicEl)
    display.appendChild(artboardEl)
  }
  return display
}

function getSVGs(skiaIconSource) {
  var lines = skiaIconSource.split('\n').filter(
    line => (line.length && !line.startsWith('//'))
  );
  const groups = [{ size: -1, commands: [] }]
  if (!skiaIconSource.includes('CANVAS_DIMENSIONS')) {
    groups[0].commands = lines.map(getCommand)
  } else {
    let currentGroup = -1
    for (const line of lines) {
      if (line.startsWith('CANVAS_DIMENSIONS')) {
        currentGroup++
        const size = Number(line.split(',')[1].trim())
        if (currentGroup > 0)  {
          groups.push({ commands: [] })
        }
        groups[currentGroup].size = size
      }
      groups[currentGroup >=0 ? currentGroup : 0].commands.push(getCommand(line))
    }
  }
  for (const group of groups) {
    var icon = new VectorIcon(group.commands);
    group.svgElement = icon.paint()
  }
  return groups
}

function getCommand(line) {
  return line.trim().split(',').filter(x => x.length > 0)
}