import getSourceUrl from './getSourceUrl'
import getVectorArtboardDisplay from '../../getVectorArtboardDisplay'

export default function handleBlobPage() {
  let isSkiaFile = false
  const pathElement = document.querySelector('.final-path')
  if (pathElement) {
    const fileName = pathElement.textContent
    isSkiaFile = true
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
  const canvasElement = document.createElement('div')
  canvasElement.style.display = 'none'
  canvasElement.style.padding = '10px'
  fileElement.appendChild(canvasElement)
  let codeElement = fileElement.querySelector(".blob-wrapper");
  let rawButton = fileElement.querySelector("#raw-url");
  let toggleButton = document.createElement('button')
  toggleButton.classList = rawButton.classList
  setToggleButtonMode(toggleButton, 'code')
  rawButton.parentNode.insertBefore(toggleButton, rawButton)
  
  toggleButton.addEventListener('click', async () => {
    let newMode = null
    if (toggleButton.getAttribute('data-mode') === 'code') {
      codeElement.style.display = 'none'
      canvasElement.style.display = 'block'
      newMode = 'graphic'

      if (canvasElement.children.length <= 0) {
        const loadMessage = document.createElement('div')
        loadMessage.classList.add('load-in-progress')
        loadMessage.textContent = 'Loading SVG...'
        canvasElement.appendChild(loadMessage)
        
        try {
          const res = await fetch(getSourceUrl(rawButton.getAttribute('href')))
          const text = await res.text()
          canvasElement.appendChild(getVectorArtboardDisplay(text))
        }
        catch(err) {
          const errorMessage = document.createElement('div')
          errorMessage.classList.add('load-failed')
          errorMessage.textContent = `Failed to load SVG. ${err.message}`
          canvasElement.appendChild(errorMessage)
        }
        loadMessage.remove()
      }
    }
    else {
      canvasElement.style.display = 'none'
      codeElement.style.display = 'block'
      newMode = 'code'
    }
    if (newMode) {
      setToggleButtonMode(toggleButton, newMode)
    }
  });
}

function setToggleButtonMode(toggleButton, mode) {
  toggleButton.setAttribute('data-mode', mode)
  toggleButton.textContent = mode === 'code' ? 'Show Graphics' : 'Show Code'
  toggleButton.setAttribute('aria-label', mode === 'code' ? 'Converted SVG Graphics' : 'Source Code')
}