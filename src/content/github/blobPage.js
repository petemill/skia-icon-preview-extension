import getSourceUrl from './getSourceUrl'
import getVectorArtboardDisplay from '../../getVectorArtboardDisplay'

export default function handleBlobPage() {
  let isSkiaFile = false
  const pathElement = document.querySelector('.final-path')
  if (pathElement) {
    const fileName = pathElement.textContent
    isSkiaFile = fileName.endsWith('.icon')
  }
  if (!isSkiaFile) {
    return
  }
  let fileEl = document.querySelector(".file");
  const hasRun = fileEl.getAttribute('data-skia-ext-active')
  if (hasRun) {
    return
  }
  handleSkiaIconFile(fileEl)
}

function handleSkiaIconFile(fileElement) {
  fileElement.setAttribute('data-skia-ext-active', true)
  let codeElement = fileElement.querySelector(".blob-wrapper");
  const graphicContentElement = document.createElement('div')
  graphicContentElement.style.padding = '10px'
  graphicContentElement.style.borderBottom = '1px solid #e1e4e8'
  codeElement.parentNode.insertBefore(graphicContentElement, codeElement)
  let rawButton = fileElement.querySelector("#raw-url");
  showGraphics(graphicContentElement, rawButton.getAttribute('href'))
}

async function showGraphics(graphicContentElement, filePath) {
  const loadMessage = document.createElement('div')
  loadMessage.classList.add('load-in-progress')
  loadMessage.textContent = 'Loading SVG...'
  graphicContentElement.appendChild(loadMessage)
  
  try {
    const res = await fetch(getSourceUrl(filePath))
    const text = await res.text()
    graphicContentElement.appendChild(getVectorArtboardDisplay(text))
  }
  catch(err) {
    const errorMessage = document.createElement('div')
    errorMessage.classList.add('load-failed')
    errorMessage.textContent = `Failed to load SVG. ${err.message}`
    graphicContentElement.appendChild(errorMessage)
  }
  loadMessage.remove()
}
