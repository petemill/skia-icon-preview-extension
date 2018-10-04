import getSourceUrl from './getSourceUrl'
import getVectorArtboardDisplay from '../../getVectorArtboardDisplay'

export default function handlePRFilesPage() {
  new MutationObserver(findPRIconFileElements)
    .observe(document.querySelector('#files'), {childList: true, subtree: true})
  findPRIconFileElements()
}

function findPRIconFileElements() {
  const fileHeaderElements = document.querySelectorAll('.file-header[data-path$=".icon"]')
  for (const fileHeaderElement of fileHeaderElements) {
    handlePRIconFileElement(fileHeaderElement.getAttribute('data-path'), fileHeaderElement.parentNode)
  }
}

function handlePRIconFileElement(filePath, fileElement) {
  if (fileElement.getAttribute('data-skia-ext-active')) {
    return
  }
  fileElement.setAttribute('data-skia-ext-active', true)
  const viewButton = fileElement.querySelector('[aria-label="View the whole file"]')
  if (!viewButton) {
    console.error(`Could not get blob version path from View button for file at ${filePath}`)
    return
  }
  const relativeChangeFilePath = viewButton.getAttribute('href')
  // main content area to toggle
  const fileContentElement = fileElement.querySelector('.js-file-content')
  const graphicContentElement = document.createElement('div')
  fileElement.appendChild(graphicContentElement)
  // add a button to toggle contents
  const toggleButton = document.createElement('button')
  toggleButton.classList = viewButton.classList
  setToggleButtonMode(toggleButton, 'code')
  toggleButton.addEventListener('click', handlePRIconFileToggle.bind(null, fileContentElement, graphicContentElement, toggleButton, relativeChangeFilePath))
  viewButton.parentNode.appendChild(toggleButton)
}

function setToggleButtonMode(toggleButton, mode) {
  toggleButton.setAttribute('data-mode', mode)
  toggleButton.textContent = mode === 'code' ? 'Show Graphics' : 'Show Code'
  toggleButton.setAttribute('aria-label', mode === 'code' ? 'Converted SVG Graphics' : 'Source Code')
}

function handlePRIconFileToggle(fileContentElement, graphicContentElement, toggleButton, relativeChangeFilePath)  {
  let newMode = null
  if (toggleButton.getAttribute('data-mode') === 'code') {
    fileContentElement.style.display = 'none'
    graphicContentElement.style.display = 'block'
    // switch to graphic
    newMode = 'graphic'
    graphicContentElement.innerHTML = ''
    showComparisonGraphics(graphicContentElement, relativeChangeFilePath)
  }
  else {
    fileContentElement.style.display = 'block'
    graphicContentElement.style.display = 'none'
    // switch to code
    newMode = 'code'
  }
  if (newMode) {
    setToggleButtonMode(toggleButton, newMode)
  }
}

const styles = {
  comparison: `
    flex: 1;
    padding: 10px;
    display: flex;
    flex-direction: column;
  `,
  
}
styles.comparisonLeft = styles.comparison + `
  align-items: flex-end;
  border-right: solid 8px #bbb;
`

async function showComparisonGraphics(graphicContentElement, relativeChangeFilePath) {
  const comparisonElement = document.createElement('div')

  comparisonElement.innerHTML = `<p>Loading...</p>`
  const fileContents = await getPRFileContents(relativeChangeFilePath)
  comparisonElement.innerHTML = ''

  comparisonElement.style.display = 'flex'
  comparisonElement.style.flexDirection = 'row'
  
  const originalElement = document.createElement('div')
  originalElement.setAttribute('style', styles.comparisonLeft)
  originalElement.innerHTML = `<h4>Original</h4>`
  if (!fileContents.originalFileContents) {
    originalElement.innerHTML += `<p><i>Did not exist</i></p>`
  } else {
    originalElement.appendChild(getVectorArtboardDisplay(fileContents.originalFileContents))
  }
  
  const modifiedElement = document.createElement('div')
  modifiedElement.setAttribute('style', styles.comparison)
  modifiedElement.innerHTML = `<h4>Modified</h4>`
  if (!fileContents.changedFileContents) {
    modifiedElement.innerHTML += `<p><i>Deleted</i></p>`
  } else {
    modifiedElement.appendChild(getVectorArtboardDisplay(fileContents.changedFileContents))
  }
  
  comparisonElement.appendChild(originalElement)
  comparisonElement.appendChild(modifiedElement)
  graphicContentElement.appendChild(comparisonElement)
}

async function getPRFileContents(relativeChangeFilePath) {
  const changeFileSourceUrl = getSourceUrl(relativeChangeFilePath)
  const originalFileSourceUrl = getSourceUrl(relativeChangeFilePath, true)
  console.log('changed:', changeFileSourceUrl)
  console.log('original:', originalFileSourceUrl)
  let changedFileContents = undefined
  try {
    const changedFileResponse = await fetch(changeFileSourceUrl)
    if (changedFileResponse.status === 404) {
      changedFileContents = null
    } else {
      changedFileContents = await changedFileResponse.text()
    }
  }
  catch (err) {
    console.error(`Error fetching changed source url. ${err.message}`)
  }

  let originalFileContents = undefined
  try {
    const originalFileResponse = await fetch(originalFileSourceUrl)
    if (originalFileResponse.status === 404) {
      originalFileContents = null
    } else {
      originalFileContents = await originalFileResponse.text()
    }
  }
  catch (err) {
    console.error(`Error fetching changed source url. ${err.message}`)
  }
  return {
    changedFileContents,
    originalFileContents
  }
}