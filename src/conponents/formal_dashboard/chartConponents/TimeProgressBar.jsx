import { useEffect, useMemo, useRef, useState } from 'react'
import pauseIcon from '../../../assets/Pause.svg'
import playButtonIcon from '../../../assets/playButton.svg'
import virusIcon from '../../../assets/VirusIcon.svg'

const playbackFrames = 240
const handleSize = 40
const handleInset = handleSize / 2
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function isValidDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) {
    return false
  }

  const [year, month, day] = String(value).split('-').map(Number)
  const candidate = new Date(Date.UTC(year, month - 1, day))

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  )
}

function resolveStartDateInput(dates, nextDate, maxDate) {
  if (!isValidDateInput(nextDate)) {
    return ''
  }

  const boundedDates = dates.filter((date) => !maxDate || date <= maxDate)

  if (boundedDates.length === 0) {
    return ''
  }

  return boundedDates.includes(nextDate) ? nextDate : ''
}

function resolveEndDateInput(dates, nextDate, minDate) {
  if (!isValidDateInput(nextDate)) {
    return ''
  }

  const boundedDates = dates.filter((date) => !minDate || date >= minDate)

  if (boundedDates.length === 0) {
    return ''
  }

  return boundedDates.includes(nextDate) ? nextDate : ''
}

export default function TimeProgressBar({
  dates = [],
  startDate = '',
  endDate = '',
  valueDate = '',
  onStartDateChange,
  onEndDateChange,
  onValueDateChange,
}) {
  const trackRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHandleHovered, setIsHandleHovered] = useState(false)
  const [startDateInput, setStartDateInput] = useState(startDate)
  const [endDateInput, setEndDateInput] = useState(endDate)

  const boundedDates = useMemo(
    () =>
      dates.filter(
        (date) => (!startDate || date >= startDate) && (!endDate || date <= endDate)
      ),
    [dates, endDate, startDate]
  )

  const safeValueDate = useMemo(() => {
    if (boundedDates.length === 0) {
      return ''
    }

    if (boundedDates.includes(valueDate)) {
      return valueDate
    }

    if (valueDate && valueDate < boundedDates[0]) {
      return boundedDates[0]
    }

    return boundedDates[boundedDates.length - 1]
  }, [boundedDates, valueDate])

  const currentIndex = Math.max(boundedDates.indexOf(safeValueDate), 0)
  const trackProgress =
    boundedDates.length <= 1 ? 0 : currentIndex / Math.max(boundedDates.length - 1, 1)
  const playbackStep = Math.max(
    1,
    Math.ceil(Math.max(boundedDates.length - 1, 1) / playbackFrames)
  )

  useEffect(() => {
    setStartDateInput(startDate)
  }, [startDate])

  useEffect(() => {
    setEndDateInput(endDate)
  }, [endDate])

  useEffect(() => {
    if (boundedDates.length > 0) {
      return
    }

    setIsPlaying(false)
  }, [boundedDates.length])

  useEffect(() => {
    if (safeValueDate && safeValueDate !== valueDate) {
      onValueDateChange?.(safeValueDate)
    }
  }, [onValueDateChange, safeValueDate, valueDate])

  useEffect(() => {
    if (!isPlaying || boundedDates.length === 0) {
      return
    }

    let nextIndex = Math.max(boundedDates.indexOf(safeValueDate), 0)
    const lastIndex = boundedDates.length - 1
    const intervalId = window.setInterval(() => {
      nextIndex = Math.min(nextIndex + playbackStep, lastIndex)
      onValueDateChange?.(boundedDates[nextIndex])

      if (nextIndex >= lastIndex) {
        setIsPlaying(false)
      }
    }, 48)

    return () => window.clearInterval(intervalId)
  }, [boundedDates, isPlaying, onValueDateChange, playbackStep, safeValueDate])

  useEffect(() => {
    if (!isDragging) {
      return
    }

    function updateValueFromClientX(clientX) {
      if (!trackRef.current || boundedDates.length === 0) {
        return
      }

      const bounds = trackRef.current.getBoundingClientRect()
      const nextRatio = clamp((clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1)
      const nextIndex =
        boundedDates.length === 1
          ? 0
          : Math.round(nextRatio * (boundedDates.length - 1))

      onValueDateChange?.(boundedDates[nextIndex])
    }

    function handlePointerMove(event) {
      updateValueFromClientX(event.clientX)
    }

    function handlePointerUp() {
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [boundedDates, isDragging, onValueDateChange])

  useEffect(() => {
    if (!isDragging) {
      return
    }

    setIsPlaying(false)
  }, [isDragging])

  function handlePlayToggle() {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }

    if (boundedDates.length === 0) {
      return
    }

    setIsPlaying(false)

    if (!safeValueDate || safeValueDate === boundedDates[boundedDates.length - 1]) {
      return
    }

    setIsPlaying(true)
  }

  function handleTrackPointerDown(event) {
    if (boundedDates.length === 0 || !trackRef.current) {
      return
    }

    const bounds = trackRef.current.getBoundingClientRect()
    const nextRatio = clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1)
    const nextIndex =
      boundedDates.length === 1 ? 0 : Math.round(nextRatio * (boundedDates.length - 1))

    setIsPlaying(false)
    onValueDateChange?.(boundedDates[nextIndex])
    setIsDragging(true)
  }

  function handleStartDateCommit() {
    const nextStartDate = resolveStartDateInput(dates, startDateInput, endDate)

    if (!nextStartDate) {
      setStartDateInput(startDate)
      return
    }

    setIsPlaying(false)
    onStartDateChange?.(nextStartDate)
  }

  function handleEndDateCommit() {
    const nextEndDate = resolveEndDateInput(dates, endDateInput, startDate)

    if (!nextEndDate) {
      setEndDateInput(endDate)
      return
    }

    setIsPlaying(false)
    onEndDateChange?.(nextEndDate)
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-[14px] bg-[var(--color-grey-bg)] px-4 py-3">
      <button
        type="button"
        onClick={handlePlayToggle}
        disabled={boundedDates.length === 0}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] transition-colors duration-150 ${
          isPlaying
            ? 'bg-[var(--color-theme)]'
            : 'bg-[var(--color-dark-grey)] hover:bg-[var(--color-cold-grey)] active:bg-[var(--color-theme)]'
        } disabled:cursor-not-allowed disabled:bg-[var(--color-medium-grey)]`}
        aria-label={isPlaying ? 'Pause time progress' : 'Play time progress'}
      >
        <img
          src={isPlaying ? pauseIcon : playButtonIcon}
          alt=""
          className="h-[18px] w-[18px]"
        />
      </button>

      <label className="group flex h-10 w-[132px] shrink-0 items-center justify-center rounded-[6px] px-2 transition-colors duration-150 hover:bg-[var(--color-cold-grey)]/35 focus-within:bg-[var(--color-cold-grey)]/35">
        <input
          type="text"
          inputMode="text"
          value={startDateInput}
          onChange={(event) => setStartDateInput(String(event.target.value ?? '').slice(0, 10))}
          onBlur={handleStartDateCommit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }
          }}
          className="ty-small w-full bg-transparent text-center text-black outline-none"
          aria-label="Timeline start date"
          placeholder="2020-01-01"
        />
      </label>

      <div
        className="relative flex h-10 min-w-0 flex-1 items-center overflow-visible"
        onPointerDown={handleTrackPointerDown}
      >
        <div
          ref={trackRef}
          className="absolute inset-y-0 overflow-visible"
          style={{ left: `${handleInset}px`, right: `${handleInset}px` }}
        >
          <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--color-medium-grey)]" />
          <div
            className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--color-theme)]"
            style={{ width: `${trackProgress * 100}%` }}
          />
          <div
            className="absolute inset-y-0 z-10 flex items-center"
            style={{
              left: `${trackProgress * 100}%`,
              transform:
                isHandleHovered && !isDragging
                  ? 'translateX(-50%) scale(1.08)'
                  : 'translateX(-50%) scale(1)',
              filter:
                isHandleHovered && !isDragging
                  ? 'drop-shadow(0 6px 12px rgba(0, 119, 159, 0.28))'
                  : 'none',
            }}
          >
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setIsDragging(true)
              }}
              onMouseEnter={() => setIsHandleHovered(true)}
              onMouseLeave={() => setIsHandleHovered(false)}
              onKeyDown={(event) => {
                if (boundedDates.length === 0) {
                  return
                }

                if (event.key === 'ArrowLeft') {
                  event.preventDefault()
                  const nextIndex = Math.max(currentIndex - 1, 0)
                  onValueDateChange?.(boundedDates[nextIndex])
                }

                if (event.key === 'ArrowRight') {
                  event.preventDefault()
                  const nextIndex = Math.min(currentIndex + 1, boundedDates.length - 1)
                  onValueDateChange?.(boundedDates[nextIndex])
                }
              }}
              className="flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 outline-none"
              aria-label={`Current timeline date ${safeValueDate || endDate}`}
            >
              <img src={virusIcon} alt="" className="block h-9 w-9" draggable="false" />
            </button>
          </div>
        </div>
      </div>

      <label className="group flex h-10 w-[132px] shrink-0 items-center justify-center rounded-[6px] px-2 transition-colors duration-150 hover:bg-[var(--color-cold-grey)]/35 focus-within:bg-[var(--color-cold-grey)]/35">
        <input
          type="text"
          inputMode="text"
          value={endDateInput}
          onChange={(event) => setEndDateInput(String(event.target.value ?? '').slice(0, 10))}
          onBlur={handleEndDateCommit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }
          }}
          className="ty-small w-full bg-transparent text-center text-black outline-none"
          aria-label="Timeline end date"
          placeholder="2023-03-09"
        />
      </label>
    </div>
  )
}
