import { useCallback, useEffect, useRef, useState } from 'react'
import editIcon from '../../../assets/editIcon.svg?raw'
import SideBar from './SideBar.jsx'

const buttonBaseClassName =
  'group inline-flex items-center opacity-100 transition-colors duration-150'

const DataFilterBar = ({
  isSidebarOpen = false,
  onToggleSidebar,
  sidebarAnchorRef,
  sidebarProps,
}) => {
  const containerRef = useRef(null)
  const [sidebarLayout, setSidebarLayout] = useState(null)

  const updateSidebarLayout = useCallback(() => {
    const containerElement = containerRef.current
    const anchorElement = sidebarAnchorRef?.current

    if (!containerElement || !anchorElement) {
      setSidebarLayout(null)
      return
    }

    const containerRect = containerElement.getBoundingClientRect()
    const anchorRect = anchorElement.getBoundingClientRect()

    setSidebarLayout({
      left: anchorRect.left - containerRect.left,
      width: anchorRect.width,
    })
  }, [sidebarAnchorRef])

  useEffect(() => {
    updateSidebarLayout()

    const containerElement = containerRef.current
    const anchorElement = sidebarAnchorRef?.current

    if (!containerElement || !anchorElement || typeof ResizeObserver === 'undefined') {
      return undefined
    }

    const resizeObserver = new ResizeObserver(() => {
      updateSidebarLayout()
    })

    resizeObserver.observe(containerElement)
    resizeObserver.observe(anchorElement)

    window.addEventListener('resize', updateSidebarLayout)
    window.addEventListener('scroll', updateSidebarLayout, true)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateSidebarLayout)
      window.removeEventListener('scroll', updateSidebarLayout, true)
    }
  }, [sidebarAnchorRef, updateSidebarLayout, isSidebarOpen])

  return (
    <div
      ref={containerRef}
      className="relative isolate flex w-full min-w-0 items-center justify-end md:w-[460px] md:shrink-0"
      style={{ zIndex: 3000 }}
      data-name="DataFilterBar"
      data-node-id="79:645"
    >
      <button
        type="button"
        onClick={() => onToggleSidebar?.(!isSidebarOpen)}
        className={`w-full ${buttonBaseClassName} ${
          isSidebarOpen
            ? 'text-theme md:rounded-[4px] md:border-2 md:border-theme md:bg-theme md:text-white'
            : 'text-black md:rounded-[4px] md:border-2 md:border-grey md:bg-white md:hover:border-theme md:hover:bg-theme md:hover:text-white'
        }`}
        aria-pressed={isSidebarOpen}
        data-node-id="79:662"
      >
          <span className="flex h-7 w-full items-center justify-center gap-1 border-b border-grey md:h-auto md:gap-2 md:border-0 md:px-2.5 md:py-2" data-node-id="79:663">
          <span
            className="h-4 w-4 text-current md:h-5 md:w-5 [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-current"
            aria-hidden="true"
            data-node-id="79:664"
            dangerouslySetInnerHTML={{ __html: editIcon }}
          />
          <span
            className="ty-small whitespace-nowrap leading-none text-current md:hidden"
            data-node-id="79:665"
          >
            Edit
          </span>
          <span
            className="hidden whitespace-nowrap leading-none text-current md:inline md:text-[var(--text-body)] md:font-normal"
            data-node-id="79:665"
          >
            Edit Countries and regions
          </span>
        </span>
      </button>
      <SideBar
        isOpen={isSidebarOpen}
        onClose={() => onToggleSidebar?.(false)}
        mobileLayout={sidebarLayout}
        {...sidebarProps}
      />
    </div>
  )
}

export default DataFilterBar
