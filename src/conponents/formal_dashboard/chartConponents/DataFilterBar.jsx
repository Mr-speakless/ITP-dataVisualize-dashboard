import editIcon from '../../../assets/editIcon.svg?raw'
import SideBar from './SideBar.jsx'

const buttonBaseClassName =
  'group inline-flex items-center rounded-[4px] border-2  transition-colors duration-150'

const DataFilterBar = ({
  isSidebarOpen = false,
  onToggleSidebar,
  sidebarProps,
}) => {
  return (
    <div
      className="relative flex items-center justify-end"
      data-name="DataFilterBar"
      data-node-id="79:645"
    >
      <button
        type="button"
        onClick={() => onToggleSidebar?.(!isSidebarOpen)}
        className={`${buttonBaseClassName} ${
          isSidebarOpen
            ? 'border-theme bg-theme text-white'
            : 'border-grey bg-white text-black hover:border-theme hover:bg-theme hover:text-white'
        }`}
        aria-pressed={isSidebarOpen}
        data-node-id="79:662"
      >
        <span className="flex items-center justify-center gap-2 p-3" data-node-id="79:663">
          <span
            className="h-5 w-5 [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-current"
            aria-hidden="true"
            data-node-id="79:664"
            dangerouslySetInnerHTML={{ __html: editIcon }}
          />
          <span className="ty-body whitespace-nowrap leading-none" data-node-id="79:665">
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
