import gitHubInjection from 'github-injection'
import ghPageType from 'github-page-type'
import handleBlobPage from './blobPage'
import handlePRFilesPage from './prFilesPage'
// make sure image gets copied to output dir
import "../../img/icon-128.png"

// When github 'navigates' via pjax or regular page load, handle new url
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
