import "../img/icon-128.png"
import gitHubInjection from 'github-injection'
import ghPageType from 'github-page-type'
import getVectorArtboardDisplay from "../../vector_artboards";

function handleBlobPage() {
  let isSkiaFile = false
  const pathElement = document.querySelector('.final-path')
  if (pathElement) {
    const fileName = pathElement.textContent
    isSkiaFile = true
  }

  if (isSkiaFile && !document.querySelector('#toggle-skia')) {
    renderToggleButton()
  }
}

function handlePRFilesPage() {
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

gitHubInjection(() => {

  switch (ghPageType(window.location.href)) {
    case ghPageType.REPOSITORY_BLOB:
      handleBlobPage()
      break
    case ghPageType.REPOSITORY_PULL_FILES:
      handlePRFilesPage()
      break
    default:
      break
  }
})

function renderToggleButton() {
  let fileElement = document.querySelector(".file");
  const astElement = document.createElement('div')
  astElement.id = 'skiaIcon'
  astElement.style.display = 'none'
  astElement.style.padding = '10px'
  fileElement.appendChild(astElement)
  let codeElement = fileElement.querySelector(".blob-wrapper");
  let rawButton = fileElement.querySelector("#raw-url");
  let toggleButton = rawButton.cloneNode()
  toggleButton.textContent = 'SVG'
  toggleButton.setAttribute('href', '#')
  toggleButton.setAttribute("id", "toggle-skia")
  rawButton.parentNode.insertBefore(toggleButton, rawButton)
  toggleButton.addEventListener('click', async () => {
    if (toggleButton.textContent === 'SVG') {
      codeElement.style.display = 'none'
      astElement.style.display = 'block'
      toggleButton.textContent = 'Code'

      // Has the file's AST been rendered yet? If not, do it now.
      if (astElement.children.length <= 0) {
        const loadMessage = document.createElement('div')
        loadMessage.classList.add('load-in-progress')
        loadMessage.textContent = 'Loading SVG...'
        astElement.appendChild(loadMessage)
        
        try {
          const res = await fetch(getSourceUrl(rawButton.getAttribute('href')))
          const text = await res.text()
          astElement.appendChild(getVectorArtboardDisplay(text))
        }
        catch(err) {
          const errorMessage = document.createElement('div')
          errorMessage.classList.add('load-failed')
          errorMessage.textContent = `Failed to load SVG. (Error = ${err.message}`
          astElement.appendChild(errorMessage)
        }
        loadMessage.remove()
      }
    }
    else {
      astElement.style.display = 'none'
      codeElement.style.display = 'block'
      toggleButton.textContent = "SVG";
    }
  });
}

function getSourceUrl(path, master = false) {
  let segments = path.split("/");
  let author = segments[1];
  let repo = segments[2];
  let branch = master ? 'master' : segments[4];
  let file = segments.slice(5).join("/");
  return `https://raw.githubusercontent.com/${author}/${repo}/${branch}/${file}`;
}
