import getSourceUrl from './getSourceUrl'
import getVectorArtboardDisplay from '../../getVectorArtboardDisplay'

export default async function handlePRFilesPage() {
  // get base ref so we can get original versions of files
  let baseRef = 'master'
  const pullRequestId = window.location.href.split('/')[6]
  try {
    const apiResponse = await fetch(`https://api.github.com/repos/brave/brave-core/pulls/${pullRequestId}`)
    const apiResult = await apiResponse.json()
    if (apiResult.base.sha) {
      baseRef = apiResult.base.sha
    }
  }
  catch (err) {
    console.error('Error with Github API, continuing with "master" base ref', err)
  }
  // Github lazy-loads file details, so re-parse when the list changes
  new MutationObserver(() => findPRIconFileElements(baseRef))
    .observe(document.querySelector('#files'), {childList: true, subtree: true})
  findPRIconFileElements(baseRef)
}

function findPRIconFileElements(baseRef) {
  const fileHeaderElements = document.querySelectorAll('.file-header[data-path$=".icon"]')
  for (const fileHeaderElement of fileHeaderElements) {
    handlePRIconFileElement(fileHeaderElement.getAttribute('data-path'), fileHeaderElement.parentNode, baseRef)
  }
}

function handlePRIconFileElement(filePath, fileElement, baseRef) {
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
  fileContentElement.parentNode.insertBefore(graphicContentElement, fileContentElement)
  showComparisonGraphics(graphicContentElement, relativeChangeFilePath, baseRef)
}


const styles = {
  comparison: `
    flex: 1;
    padding: 10px;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid #e1e4e8;
  `,
  
}
styles.comparisonLeft = styles.comparison + `
  align-items: flex-end;
  border-right: solid 8px #bbb;
`

async function showComparisonGraphics(graphicContentElement, relativeChangeFilePath, baseRef) {
  const comparisonElement = document.createElement('div')

  comparisonElement.innerHTML = `<p>Loading...</p>`
  const fileContents = await getPRFileContents(relativeChangeFilePath, baseRef)
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

async function getPRFileContents(relativeChangeFilePath, baseRef) {
  const changeFileSourceUrl = getSourceUrl(relativeChangeFilePath)
  const originalFileSourceUrl = getSourceUrl(relativeChangeFilePath, baseRef)
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