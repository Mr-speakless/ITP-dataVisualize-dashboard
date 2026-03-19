import editIcon from '../../../assets/editIcon.svg?raw'
import SideBar from './SideBar.jsx'

const buttonBaseClassName =
  'group inline-flex items-center rounded-[4px] border-2 opacity-100 transition-colors duration-150'

const DataFilterBar = ({
  isSidebarOpen = false,
  onToggleSidebar,
  sidebarProps,
}) => {
  return (
    <div
      className="relative isolate flex w-full items-center justify-stretch sm:w-auto sm:justify-end md:w-[460px]"
      style={{ zIndex: 3000 }}
      data-name="DataFilterBar"
      data-node-id="79:645"
    >
      <button
        type="button"
        onClick={() => onToggleSidebar?.(!isSidebarOpen)}
        className={`w-full sm:w-auto md:w-full ${buttonBaseClassName} ${
          isSidebarOpen
            ? 'border-theme bg-theme text-white'
            : 'border-grey bg-white text-black hover:border-theme hover:bg-theme hover:text-white'
        }`}
        aria-pressed={isSidebarOpen}
        data-node-id="79:662"
      >
          <span className="flex w-full items-center justify-center gap-2 p-3" data-node-id="79:663">
          <span
            className="h-4 w-4 text-current sm:h-5 sm:w-5 [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-current"
            aria-hidden="true"
            data-node-id="79:664"
            dangerouslySetInnerHTML={{ __html: editIcon }}
          />
          <span
              className="ty-small whitespace-nowrap leading-none text-current sm:text-[var(--text-body)] sm:font-normal"
              data-node-id="79:665"
            >
              Edit Countries and regions
          </span>
        </span>
      </button>
      <SideBar
        isOpen={isSidebarOpen}
        onClose={() => onToggleSidebar?.(false)}
        {...sidebarProps}
      />
    </div>
  )
}

export default DataFilterBar
