import { FolderState } from "../ExplorerNode"

type MaybeHTMLElement = HTMLElement | undefined
let currentExplorerState: FolderState[]
const observer = new IntersectionObserver((entries) => {
  // If last element is observed, remove gradient of "overflow" class so element is visible
  const explorerUl = document.getElementById("explorer-ul")
  if (!explorerUl) return
  for (const entry of entries) {
    if (entry.isIntersecting) {
      explorerUl.classList.add("no-background")
    } else {
      explorerUl.classList.remove("no-background")
    }
  }
})

function toggleExplorer(this: HTMLElement) {
  this.classList.toggle("collapsed")
  this.setAttribute(
    "aria-expanded",
    this.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )
  const content = this.nextElementSibling as MaybeHTMLElement
  if (!content) return

  content.classList.toggle("collapsed")
}

function toggleFolder(evt: MouseEvent) {
  evt.stopPropagation()
  const target = evt.target as MaybeHTMLElement
  if (!target) return

  const isSvg = target.nodeName === "svg"
  const childFolderContainer = (
    isSvg
      ? target.parentElement?.nextSibling
      : target.parentElement?.parentElement?.nextElementSibling
  ) as MaybeHTMLElement
  const currentFolderParent = (
    isSvg ? target.nextElementSibling : target.parentElement
  ) as MaybeHTMLElement
  if (!(childFolderContainer && currentFolderParent)) return

  childFolderContainer.classList.toggle("open")
  const isCollapsed = childFolderContainer.classList.contains("open")
  setFolderState(childFolderContainer, !isCollapsed)
  const fullFolderPath = currentFolderParent.dataset.folderpath as string
  toggleCollapsedByPath(currentExplorerState, fullFolderPath)
  const stringifiedFileTree = JSON.stringify(currentExplorerState)
  localStorage.setItem("fileTree", stringifiedFileTree)
}

function setupExplorer() {
  const explorer = document.getElementById("explorer")
  if (!explorer) return

  // Setup folder collapse behavior

  
  if (explorer.dataset.behavior === "collapse") {
    const folderButtons = document.getElementsByClassName("folder-button") as HTMLCollectionOf<HTMLElement>
    for (const item of folderButtons) {
      item.addEventListener("click", toggleFolder)
      window.addCleanup(() => item.removeEventListener("click", toggleFolder))
    }
  }
  

  // Setup file collapse behavior
  const fileButtons = document.querySelectorAll(".file-button")
  fileButtons.forEach((btn) => {
    const handler = (evt) => {
      evt.stopPropagation()
      const filePath = btn.getAttribute("data-filepath")
      const content = document.querySelector(`.file-outer[data-fileul="${filePath}"]`)
      if (content) {
        const isOpen = content.classList.toggle("open")
        content.classList.toggle("collapsed", !isOpen)
        btn.setAttribute("aria-expanded", isOpen ? "true" : "false")
    
        toggleCollapsedByPath(currentExplorerState, filePath!)
        localStorage.setItem("fileTree", JSON.stringify(currentExplorerState))
      }
    }
    
    btn.addEventListener("click", handler)
    window.addCleanup(() => btn.removeEventListener("click", handler))    
  })

  // Expand current file node if it's the active page
  const currentSlug = window.location.pathname.replace(/\/$/, "")
  const allFileNodes = document.querySelectorAll(`.file-outer[data-fileul]`)
  for (const node of allFileNodes) {
    const filePath = node.getAttribute("data-fileul")
    if (!filePath) continue

    const resolvedPath = new URL(filePath, window.location.origin).pathname.replace(/\/$/, "")
    if (currentSlug.endsWith(resolvedPath)) {
      node.classList.add("open")
      node.classList.remove("collapsed")

      // Update explorer state
      toggleCollapsedByPath(currentExplorerState, filePath)

      // Update toggle button state
      const toggleBtn = document.querySelector(`.file-button[data-filepath="${filePath}"]`)
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", "true")
      }

      // Expand parent folders if needed
      let parent = node.parentElement
      while (parent) {
        if (parent.classList.contains("folder-outer")) {
          parent.classList.add("open")
        }
        parent = parent.parentElement
      }
    }
  }

  // Setup explorer toggle button
  explorer.addEventListener("click", toggleExplorer)
  window.addCleanup(() => explorer.removeEventListener("click", toggleExplorer))

  // Setup folder icon click behavior
  const folderIcons = document.getElementsByClassName("folder-icon") as HTMLCollectionOf<HTMLElement>
  for (const item of folderIcons) {
    item.addEventListener("click", toggleFolder)
    window.addCleanup(() => item.removeEventListener("click", toggleFolder))
  }

  // Load folder state from localStorage
  const storageTree = localStorage.getItem("fileTree")
  const useSavedFolderState = explorer?.dataset.savestate === "true"
  const oldExplorerState: FolderState[] =
    storageTree && useSavedFolderState ? JSON.parse(storageTree) : []
  const oldIndex = new Map(oldExplorerState.map((entry) => [entry.path, entry.collapsed]))

  const newExplorerState: FolderState[] = explorer.dataset.tree
    ? JSON.parse(explorer.dataset.tree)
    : []

  currentExplorerState = newExplorerState.map(({ path, collapsed }) => ({
    path,
    collapsed: oldIndex.get(path) ?? collapsed,
  }))

  // Apply folder state
  currentExplorerState.forEach(({ path, collapsed }) => {
    const folderLi = document.querySelector(`[data-folderpath='${path}']`) as MaybeHTMLElement
    const folderUl = folderLi?.parentElement?.nextElementSibling as MaybeHTMLElement
    if (folderUl) {
      setFolderState(folderUl, collapsed)
    }
  })
}

window.addEventListener("resize", setupExplorer)
document.addEventListener("nav", () => {
  setupExplorer()
  observer.disconnect()

  // select pseudo element at end of list
  const lastItem = document.getElementById("explorer-end")
  if (lastItem) {
    observer.observe(lastItem)
  }
})

/**
 * Toggles the state of a given folder
 * @param folderElement <div class="folder-outer"> Element of folder (parent)
 * @param collapsed if folder should be set to collapsed or not
 */
function setFolderState(folderElement: HTMLElement, collapsed: boolean) {
  return collapsed ? folderElement.classList.remove("open") : folderElement.classList.add("open")
}

/**
 * Toggles visibility of a folder
 * @param array array of FolderState (`fileTree`, either get from local storage or data attribute)
 * @param path path to folder (e.g. 'advanced/more/more2')
 */
function toggleCollapsedByPath(array: FolderState[], path: string) {
  const entry = array.find((item) => item.path === path)
  if (entry) {
    entry.collapsed = !entry.collapsed
  }
}
