$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$jsxPath = Join-Path $repoRoot 'src/conponents/formal_dashboard/chartConponents/WorldProjectionMap.jsx'
$jsx = Get-Content $jsxPath -Raw

function Get-ObjectFreezeBlockContent([string]$source, [string]$constName) {
  $marker = "const $constName = Object.freeze({"
  $startMarkerIndex = $source.IndexOf($marker)
  if ($startMarkerIndex -lt 0) { return $null }

  $openBraceIndex = $source.IndexOf('{', $startMarkerIndex)
  if ($openBraceIndex -lt 0) { return $null }

  $depth = 0
  for ($i = $openBraceIndex; $i -lt $source.Length; $i += 1) {
    $ch = $source[$i]
    if ($ch -eq '{') {
      $depth += 1
    } elseif ($ch -eq '}') {
      $depth -= 1
      if ($depth -eq 0) {
        return $source.Substring($openBraceIndex + 1, $i - $openBraceIndex - 1)
      }
    }
  }

  return $null
}

function New-CaseInsensitiveSet() {
  return [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
}

function Normalize-MapLookupName([string]$value) {
  if ($null -eq $value) { return '' }
  $result = $value.Normalize([Text.NormalizationForm]::FormD)
  $result = [regex]::Replace($result, '[\u0300-\u036f]', '')
  $result = [regex]::Replace($result, '[^\x00-\x7F]', ' ')
  $result = $result -replace '\*', ''
  $result = $result -replace '&', ' and '
  $result = $result -replace '[().,''-]', ' '
  $result = $result -replace '\s+', ' '
  return $result.Trim().ToLowerInvariant()
}

function Normalize-RegionalCompactName([string]$value) {
  return (Normalize-MapLookupName $value) -replace '\s+', ''
}

function Normalize-RegionalCanonicalName([string]$value, [System.Collections.Generic.HashSet[string]]$dropWords) {
  $normalized = (Normalize-MapLookupName $value) -replace '\bcity of\b', ' '
  $tokens = $normalized -split ' ' | Where-Object { $_ -and -not $dropWords.Contains($_) }
  return ($tokens -join ' ').Trim()
}

function Escape-AttributeValue([string]$value) {
  return ([string]$value).Replace('\', '\\').Replace('"', '\"')
}

function Compute-LevenshteinDistance([string]$left, [string]$right) {
  $leftText = [string]$left
  $rightText = [string]$right

  if ($leftText -eq $rightText) { return 0 }
  if ($leftText.Length -eq 0) { return $rightText.Length }
  if ($rightText.Length -eq 0) { return $leftText.Length }

  $rowCount = $leftText.Length + 1
  $columnCount = $rightText.Length + 1
  $matrix = New-Object 'int[,]' $rowCount, $columnCount

  for ($rowIndex = 0; $rowIndex -lt $rowCount; $rowIndex += 1) {
    $matrix[$rowIndex, 0] = $rowIndex
  }
  for ($columnIndex = 0; $columnIndex -lt $columnCount; $columnIndex += 1) {
    $matrix[0, $columnIndex] = $columnIndex
  }

  for ($rowIndex = 1; $rowIndex -lt $rowCount; $rowIndex += 1) {
    $leftChar = $leftText.Substring($rowIndex - 1, 1)
    for ($columnIndex = 1; $columnIndex -lt $columnCount; $columnIndex += 1) {
      $rightChar = $rightText.Substring($columnIndex - 1, 1)
      $cost = if ($leftChar -eq $rightChar) { 0 } else { 1 }
      $deletion = $matrix[$rowIndex - 1, $columnIndex] + 1
      $insertion = $matrix[$rowIndex, $columnIndex - 1] + 1
      $substitution = $matrix[$rowIndex - 1, $columnIndex - 1] + $cost
      $matrix[$rowIndex, $columnIndex] = [Math]::Min(
        [Math]::Min($deletion, $insertion),
        $substitution
      )
    }
  }

  return $matrix[$rowCount - 1, $columnCount - 1]
}

function Build-RegionalPathEntries([string]$svgRaw, [System.Collections.Generic.HashSet[string]]$dropWords) {
  $entries = New-Object System.Collections.ArrayList
  $unique = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  if ([string]::IsNullOrWhiteSpace($svgRaw)) { return $entries }

  $pathTagMatches = [regex]::Matches($svgRaw, '<path\b[^>]*>', 'IgnoreCase')
  $supportedAttributes = @('name', 'title', 'id', 'class')

  foreach ($pathTagMatch in $pathTagMatches) {
    $pathTag = $pathTagMatch.Value
    foreach ($attributeName in $supportedAttributes) {
      $attributeRegex = '\b' + $attributeName + '="([^"]+)"'
      $attributeMatch = [regex]::Match($pathTag, $attributeRegex, 'IgnoreCase')
      if (-not $attributeMatch.Success) { continue }

      $attributeValue = $attributeMatch.Groups[1].Value
      $normalizedName = Normalize-MapLookupName $attributeValue
      if (-not $normalizedName) { continue }

      $selector = 'path[' + $attributeName + '="' + (Escape-AttributeValue $attributeValue) + '"]'
      $entryKey = $selector + '::' + $normalizedName
      if ($unique.Contains($entryKey)) { continue }

      [void]$unique.Add($entryKey)
      [void]$entries.Add([pscustomobject]@{
          normalizedName = $normalizedName
          compactName    = Normalize-RegionalCompactName $attributeValue
          canonicalName  = Normalize-RegionalCanonicalName $attributeValue $dropWords
          pathName       = $attributeValue
          selector       = $selector
        })
    }
  }

  return $entries
}

function Build-RegionalPathLookups($entries) {
  $byNormalized = @{}
  $byCompact = @{}
  $byCanonical = @{}

  foreach ($entry in $entries) {
    if (-not $entry.normalizedName) { continue }
    if (-not $byNormalized.ContainsKey($entry.normalizedName)) {
      $byNormalized[$entry.normalizedName] = $entry
    }

    if ($entry.compactName) {
      if (-not $byCompact.ContainsKey($entry.compactName)) {
        $byCompact[$entry.compactName] = New-Object System.Collections.ArrayList
      }
      [void]$byCompact[$entry.compactName].Add($entry)
    }

    if ($entry.canonicalName) {
      if (-not $byCanonical.ContainsKey($entry.canonicalName)) {
        $byCanonical[$entry.canonicalName] = New-Object System.Collections.ArrayList
      }
      [void]$byCanonical[$entry.canonicalName].Add($entry)
    }
  }

  return [pscustomobject]@{
    byNormalized = $byNormalized
    byCompact    = $byCompact
    byCanonical  = $byCanonical
    entries      = $entries
  }
}

function Resolve-RegionalPathEntryForName(
  [string]$regionName,
  [string]$focusedCountryName,
  $pathLookups,
  $aliasByCountryNormalized,
  [bool]$allowApproximateMatch,
  [System.Collections.Generic.HashSet[string]]$dropWords
) {
  $normalizedCountryName = Normalize-MapLookupName $regionName
  if (-not $normalizedCountryName) { return $null }

  if ($pathLookups.byNormalized.ContainsKey($normalizedCountryName)) {
    return $pathLookups.byNormalized[$normalizedCountryName]
  }

  $countryAliasLookup = @{}
  $normalizedFocusedCountryName = Normalize-MapLookupName $focusedCountryName
  if ($aliasByCountryNormalized.ContainsKey($normalizedFocusedCountryName)) {
    $countryAliasLookup = $aliasByCountryNormalized[$normalizedFocusedCountryName]
  }
  if ($countryAliasLookup.ContainsKey($normalizedCountryName)) {
    $aliasTargetName = $countryAliasLookup[$normalizedCountryName]
    if ($pathLookups.byNormalized.ContainsKey($aliasTargetName)) {
      return $pathLookups.byNormalized[$aliasTargetName]
    }
  }

  $compactCountryName = Normalize-RegionalCompactName $regionName
  if ($compactCountryName -and $pathLookups.byCompact.ContainsKey($compactCountryName)) {
    $compactEntries = $pathLookups.byCompact[$compactCountryName]
    if ($compactEntries.Count -eq 1) { return $compactEntries[0] }
  }

  $canonicalCountryName = Normalize-RegionalCanonicalName $regionName $dropWords
  if ($canonicalCountryName -and $pathLookups.byCanonical.ContainsKey($canonicalCountryName)) {
    $canonicalEntries = $pathLookups.byCanonical[$canonicalCountryName]
    if ($canonicalEntries.Count -eq 1) { return $canonicalEntries[0] }
  }

  if (-not $allowApproximateMatch) { return $null }
  if (-not $compactCountryName -or $compactCountryName.Length -lt 4) { return $null }

  $bestEntry = $null
  $bestDistance = [double]::PositiveInfinity
  $bestCount = 0

  foreach ($pathEntry in $pathLookups.entries) {
    if (-not $pathEntry.compactName) { continue }
    $currentDistance = Compute-LevenshteinDistance $compactCountryName $pathEntry.compactName
    if ($currentDistance -lt $bestDistance) {
      $bestDistance = $currentDistance
      $bestEntry = $pathEntry
      $bestCount = 1
      continue
    }
    if ($currentDistance -eq $bestDistance) {
      $bestCount += 1
    }
  }

  if ($bestEntry -and $bestCount -eq 1 -and $bestDistance -le 2) {
    $ratio = $bestDistance / [Math]::Max($compactCountryName.Length, $bestEntry.compactName.Length)
    if ($ratio -le 0.34) {
      return $bestEntry
    }
  }

  return $null
}

function Normalize-WorldRegionPathName([string]$regionName) {
  return ([string]$regionName).Trim().Replace(' ', '_').Replace(',', '')
}

# Parse imports in WorldProjectionMap.jsx
$importVarToAsset = @{}
[regex]::Matches($jsx, "import\s+([A-Za-z0-9_]+)\s+from\s+'\.\./\.\./\.\./assets/([^']+)\?raw'", 'IgnoreCase') | ForEach-Object {
  $varName = $_.Groups[1].Value
  $assetRelative = $_.Groups[2].Value
  $importVarToAsset[$varName] = Join-Path 'src/assets' $assetRelative
}

# Parse regionalMapRawByCountryName
$regionalMapBlock = Get-ObjectFreezeBlockContent $jsx 'regionalMapRawByCountryName'
$regionalCountryToAsset = @{}
[regex]::Matches($regionalMapBlock, "(?m)^\s*(?:'([^']+)'|([A-Za-z][A-Za-z ]*[A-Za-z]))\s*:\s*([A-Za-z0-9_]+)\s*,") | ForEach-Object {
  $country = if ($_.Groups[1].Success) { $_.Groups[1].Value } else { $_.Groups[2].Value }
  $varName = $_.Groups[3].Value
  if ($importVarToAsset.ContainsKey($varName)) {
    $regionalCountryToAsset[$country] = $importVarToAsset[$varName]
  }
}

# Parse regionalMapNameAliasesByCountry
$aliasBlock = Get-ObjectFreezeBlockContent $jsx 'regionalMapNameAliasesByCountry'
$aliasByCountryNormalized = @{}
$countryHeaderMatches = [regex]::Matches($aliasBlock, "(?m)^\s*(?:'([^']+)'|([A-Za-z][A-Za-z ]*[A-Za-z]))\s*:\s*\{")
foreach ($header in $countryHeaderMatches) {
  $countryName = if ($header.Groups[1].Success) { $header.Groups[1].Value } else { $header.Groups[2].Value }
  $openBraceIndex = $header.Index + $header.Length - 1
  $depth = 0
  $closeBraceIndex = -1
  for ($i = $openBraceIndex; $i -lt $aliasBlock.Length; $i += 1) {
    $ch = $aliasBlock[$i]
    if ($ch -eq '{') {
      $depth += 1
    } elseif ($ch -eq '}') {
      $depth -= 1
      if ($depth -eq 0) {
        $closeBraceIndex = $i
        break
      }
    }
  }
  if ($closeBraceIndex -lt 0) { continue }
  $innerBlock = $aliasBlock.Substring($openBraceIndex + 1, $closeBraceIndex - $openBraceIndex - 1)
  $countryNormalizedName = Normalize-MapLookupName $countryName
  $aliasLookup = @{}
  [regex]::Matches($innerBlock, "(?:'([^']+)'|([A-Za-z][A-Za-z ]*[A-Za-z]))\s*:\s*'([^']+)'") | ForEach-Object {
    $sourceName = if ($_.Groups[1].Success) { $_.Groups[1].Value } else { $_.Groups[2].Value }
    $targetName = $_.Groups[3].Value
    $sourceNormalizedName = Normalize-MapLookupName $sourceName
    $targetNormalizedName = Normalize-MapLookupName $targetName
    if ($sourceNormalizedName -and $targetNormalizedName) {
      $aliasLookup[$sourceNormalizedName] = $targetNormalizedName
    }
  }
  $aliasByCountryNormalized[$countryNormalizedName] = $aliasLookup
}

# Parse canonical drop words
$dropWordSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$dropSetMatch = [regex]::Match($jsx, 'const\s+regionalMapCanonicalDropWords\s*=\s*new Set\(\[([\s\S]*?)\]\)', 'IgnoreCase')
if ($dropSetMatch.Success) {
  foreach ($match in [regex]::Matches($dropSetMatch.Groups[1].Value, "'([^']+)'")) {
    if ($null -ne $match -and $match.Groups.Count -gt 1) {
      $dropWord = [string]$match.Groups[1].Value
      if ($dropWord) {
        [void]$dropWordSet.Add($dropWord)
      }
    }
  }
}

# Parse usaStateCodeByRegionName
$usaStateCodeByName = @{}
$usaStateCodeBlock = Get-ObjectFreezeBlockContent $jsx 'usaStateCodeByRegionName'
[regex]::Matches($usaStateCodeBlock, "(?:'([^']+)'|([A-Za-z][A-Za-z ]*[A-Za-z]))\s*:\s*'([a-z]+)'", 'IgnoreCase') | ForEach-Object {
  $stateName = if ($_.Groups[1].Success) { $_.Groups[1].Value } else { $_.Groups[2].Value }
  $stateCode = $_.Groups[3].Value.ToLowerInvariant()
  $usaStateCodeByName[(Normalize-MapLookupName $stateName)] = $stateCode
}

$stateNameByCode = @{}
foreach ($key in $usaStateCodeByName.Keys) {
  $code = $usaStateCodeByName[$key]
  if (-not $stateNameByCode.ContainsKey($code)) {
    $stateNameByCode[$code] = $key
  }
}

# Build USA map file by state code (prefer file without (n) suffix)
$usaMapFiles = Get-ChildItem -Path (Join-Path $repoRoot 'src/assets/USAmap') -File -Filter 'usa-*.svg'
$usaMapFileByStateCode = @{}
foreach ($file in $usaMapFiles) {
  $match = [regex]::Match($file.Name.ToLowerInvariant(), '^usa-([a-z]+)(?:\s*\(\d+\))?\.svg$')
  if (-not $match.Success) { continue }
  $stateCode = $match.Groups[1].Value
  if ($stateCode -eq 'usa') { continue }
  if ($stateCode -eq 'wdc') { $stateCode = 'dc' }
  $score = if ($file.Name -match '\(\d+\)\.svg$') { 0 } else { 1 }
  if (-not $usaMapFileByStateCode.ContainsKey($stateCode)) {
    $usaMapFileByStateCode[$stateCode] = [pscustomobject]@{
      file  = $file.FullName
      name  = $file.Name
      score = $score
    }
  } elseif ($score -gt $usaMapFileByStateCode[$stateCode].score) {
    $usaMapFileByStateCode[$stateCode] = [pscustomobject]@{
      file  = $file.FullName
      name  = $file.Name
      score = $score
    }
  }
}

$baseUrl = 'https://jht1493.net/COVID-19-Impact/Dashboard/a0/c_data/world'
$targetDate = '2023-03-09'
$worldMeta = Invoke-RestMethod -Uri "$baseUrl/c_meta.json"

# Regional map audit
$regionalAuditRows = New-Object System.Collections.ArrayList
$countriesWithRegionalData = @(
  $worldMeta.c_regions |
    Where-Object { [int]($_.n_subs) -gt 0 } |
    ForEach-Object { $_.c_ref }
)
$mapCountries = @($regionalCountryToAsset.Keys)

foreach ($country in ($mapCountries | Sort-Object)) {
  $assetRelative = $regionalCountryToAsset[$country]
  $assetPath = Join-Path $repoRoot $assetRelative

  $row = [ordered]@{
    country      = $country
    mapAsset     = $assetRelative
    hasMapFile   = Test-Path $assetPath
    hasData      = $false
    dataRows     = 0
    mappedRows   = 0
    unmappedRows = 0
    unmappedNames = @()
    note         = ''
  }

  if (-not $row.hasMapFile) {
    $row.note = 'Map file missing in repository.'
    [void]$regionalAuditRows.Add([pscustomobject]$row)
    continue
  }

  $countryPath = Normalize-WorldRegionPathName $country
  $dataUrl = "$baseUrl/c_subs/$countryPath/c_days/$targetDate.json"
  try {
    $dayItems = Invoke-RestMethod -Uri $dataUrl
    $row.hasData = $true
    $row.dataRows = @($dayItems).Count
    try {
      $svgRaw = Get-Content $assetPath -Raw
      $pathEntries = Build-RegionalPathEntries $svgRaw $dropWordSet
      $pathLookups = Build-RegionalPathLookups $pathEntries

      # Keep audit deterministic and conservative: do not rely on fuzzy fallback in the report.
      $allowApproximateMatch = $false
      $unmapped = New-Object System.Collections.ArrayList
      $mappedCount = 0
      foreach ($item in @($dayItems)) {
        $regionName = [string]$item.c_ref
        $matchEntry = Resolve-RegionalPathEntryForName `
          -regionName $regionName `
          -focusedCountryName $country `
          -pathLookups $pathLookups `
          -aliasByCountryNormalized $aliasByCountryNormalized `
          -allowApproximateMatch:$allowApproximateMatch `
          -dropWords $dropWordSet
        if ($null -ne $matchEntry) {
          $mappedCount += 1
        } else {
          [void]$unmapped.Add($regionName)
        }
      }

      $row.mappedRows = $mappedCount
      $row.unmappedRows = $unmapped.Count
      $row.unmappedNames = @($unmapped | Sort-Object)
      $row.note = if ($row.unmappedRows -gt 0) {
        'Partial mapping (some data rows could not bind to map paths).'
      } else {
        'Full mapping for this snapshot date.'
      }
    }
    catch {
      $row.mappedRows = 0
      $row.unmappedRows = $row.dataRows
      $row.unmappedNames = @($dayItems | ForEach-Object { [string]$_.c_ref } | Sort-Object)
      $row.note = "Mapping failed: $($_.Exception.Message)"
    }
  }
  catch {
    $row.note = 'No regional snapshot data found for this country/date.'
  }

  [void]$regionalAuditRows.Add([pscustomobject]$row)
}

# Regional data but no map
$mapCountrySet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($name in $mapCountries) { [void]$mapCountrySet.Add($name) }
$countriesDataNoMap = @(
  $countriesWithRegionalData |
    Where-Object { -not $mapCountrySet.Contains($_) } |
    Sort-Object
)
$countriesMapNoData = @(
  $regionalAuditRows |
    Where-Object { $_.hasMapFile -and -not $_.hasData } |
    Select-Object -ExpandProperty country
)

# USA level-2 (explicit US-XX mapping)
$usaSvgPath = Join-Path $repoRoot 'src/assets/USAmap/usa.svg'
$usaSvgRaw = Get-Content $usaSvgPath -Raw
$usaStateIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
[regex]::Matches($usaSvgRaw, '\bid="US-([A-Z]{2})"', 'IgnoreCase') | ForEach-Object {
  [void]$usaStateIds.Add($_.Groups[1].Value.ToLowerInvariant())
}

$usLevel2Items = Invoke-RestMethod -Uri "$baseUrl/c_subs/United_States/c_days/$targetDate.json"
$usL2Mapped = New-Object System.Collections.ArrayList
$usL2Unmapped = New-Object System.Collections.ArrayList
foreach ($item in @($usLevel2Items)) {
  $regionName = [string]$item.c_ref
  $normalized = Normalize-MapLookupName $regionName
  $stateCode = if ($usaStateCodeByName.ContainsKey($normalized)) { $usaStateCodeByName[$normalized] } else { $null }
  if ($stateCode -and $usaStateIds.Contains($stateCode)) {
    [void]$usL2Mapped.Add($regionName)
  } else {
    [void]$usL2Unmapped.Add($regionName)
  }
}

$usDataStateCodes = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($item in @($usLevel2Items)) {
  $normalized = Normalize-MapLookupName ([string]$item.c_ref)
  if ($usaStateCodeByName.ContainsKey($normalized)) {
    [void]$usDataStateCodes.Add($usaStateCodeByName[$normalized])
  }
}
$usMapOnlyCodes = @($usaStateIds | Where-Object { -not $usDataStateCodes.Contains($_) } | Sort-Object)

# USA level-3 by state map
$usMeta = Invoke-RestMethod -Uri "$baseUrl/c_subs/United_States/c_meta.json"
$usStateMetaRows = @($usMeta.c_regions)
$stateNamesWithL3Data = @(
  $usStateMetaRows |
    Where-Object { [int]($_.n_subs) -gt 0 } |
    ForEach-Object { $_.c_ref }
)

$stateCodesWithL3Data = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($stateName in $stateNamesWithL3Data) {
  $normalized = Normalize-MapLookupName $stateName
  if ($usaStateCodeByName.ContainsKey($normalized)) {
    [void]$stateCodesWithL3Data.Add($usaStateCodeByName[$normalized])
  }
}

function Convert-NormalizedNameToTitle([string]$normalizedName) {
  if (-not $normalizedName) { return '' }
  return (($normalizedName -split ' ') | ForEach-Object {
      if (-not $_) { return $_ }
      if ($_.Length -eq 1) { return $_.ToUpperInvariant() }
      return $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1)
    }) -join ' '
}

$usL3Rows = New-Object System.Collections.ArrayList
foreach ($stateCode in ($usaMapFileByStateCode.Keys | Sort-Object)) {
  $fileInfo = $usaMapFileByStateCode[$stateCode]
  $normalizedStateName = if ($stateNameByCode.ContainsKey($stateCode)) { $stateNameByCode[$stateCode] } else { $stateCode }
  $stateDisplayName = Convert-NormalizedNameToTitle $normalizedStateName
  $statePathName = Normalize-WorldRegionPathName $stateDisplayName

  $row = [ordered]@{
    stateCode     = $stateCode
    stateName     = $stateDisplayName
    mapFile       = "src/assets/USAmap/$($fileInfo.name)"
    hasData       = $false
    dataRows      = 0
    mappedRows    = 0
    unmappedRows  = 0
    unmappedNames = @()
    note          = ''
  }

  $stateDataUrl = "$baseUrl/c_subs/United_States/c_subs/$statePathName/c_days/$targetDate.json"
  try {
    $stateItems = Invoke-RestMethod -Uri $stateDataUrl
    $row.hasData = $true
    $row.dataRows = @($stateItems).Count

    $svgRaw = Get-Content $fileInfo.file -Raw
    $pathEntries = Build-RegionalPathEntries $svgRaw $dropWordSet
    $pathLookups = Build-RegionalPathLookups $pathEntries

    $mappedCount = 0
    $unmapped = New-Object System.Collections.ArrayList
    foreach ($item in @($stateItems)) {
      $regionName = [string]$item.c_ref
      $entry = Resolve-RegionalPathEntryForName `
        -regionName $regionName `
        -focusedCountryName 'United States' `
        -pathLookups $pathLookups `
        -aliasByCountryNormalized $aliasByCountryNormalized `
        -allowApproximateMatch:$false `
        -dropWords $dropWordSet
      if ($null -ne $entry) {
        $mappedCount += 1
      } else {
        [void]$unmapped.Add($regionName)
      }
    }

    $row.mappedRows = $mappedCount
    $row.unmappedRows = $unmapped.Count
    $row.unmappedNames = @($unmapped | Sort-Object)
    $row.note = if ($row.unmappedRows -gt 0) {
      'Partial mapping in county/district level.'
    } else {
      'Full mapping for this snapshot date.'
    }
  }
  catch {
    $row.note = 'No level-3 data snapshot found for this state/date.'
  }

  [void]$usL3Rows.Add([pscustomobject]$row)
}

$stateCodesWithMap = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($code in $usaMapFileByStateCode.Keys) { [void]$stateCodesWithMap.Add($code) }

$usL3DataNoMap = @()
foreach ($stateName in $stateNamesWithL3Data) {
  $normalized = Normalize-MapLookupName $stateName
  if (-not $usaStateCodeByName.ContainsKey($normalized)) { continue }
  $code = $usaStateCodeByName[$normalized]
  if (-not $stateCodesWithMap.Contains($code)) {
    $usL3DataNoMap += $stateName
  }
}
$usL3DataNoMap = $usL3DataNoMap | Sort-Object -Unique
$usL3MapNoData = @($usL3Rows | Where-Object { -not $_.hasData } | Select-Object -ExpandProperty stateName)
$usL3Partial = @($usL3Rows | Where-Object { $_.hasData -and $_.unmappedRows -gt 0 })
$usL3Full = @($usL3Rows | Where-Object { $_.hasData -and $_.unmappedRows -eq 0 })

# Build Markdown
$today = Get-Date -Format 'yyyy-MM-dd'
$lines = New-Object System.Collections.ArrayList
[void]$lines.Add('# Map-Data Mapping Audit (World / Regional / USA)')
[void]$lines.Add('')
[void]$lines.Add("- Generated on: $today")
[void]$lines.Add("- Snapshot date used for checks: $targetDate")
[void]$lines.Add('- Code baseline: current local workspace')
[void]$lines.Add('')
[void]$lines.Add('## Scope')
[void]$lines.Add('')
[void]$lines.Add('- Level 1: world map (country level) is not re-audited here; this document focuses on regional/subregional mapping status and gaps.')
[void]$lines.Add('- Level 2: country -> regional map assets from `regionalMapRawByCountryName` in `WorldProjectionMap.jsx`.')
[void]$lines.Add('- USA Level 2: `src/assets/USAmap/usa.svg` with explicit `US-XX` mapping logic.')
[void]$lines.Add('- USA Level 3: `src/assets/USAmap/usa-xx.svg` maps where available.')
[void]$lines.Add('')
[void]$lines.Add('## Executive Summary')
[void]$lines.Add('')
$regionalWithData = @($regionalAuditRows | Where-Object { $_.hasData }).Count
$regionalPartial = @($regionalAuditRows | Where-Object { $_.hasData -and $_.unmappedRows -gt 0 }).Count
[void]$lines.Add("- Regional country maps configured: $($regionalAuditRows.Count)")
[void]$lines.Add("- Regional country maps with data available: $regionalWithData")
[void]$lines.Add("- Regional country maps with partial/unmapped rows: $regionalPartial")
[void]$lines.Add("- Countries with regional data but no configured map asset: $($countriesDataNoMap.Count)")
[void]$lines.Add("- USA level-2 mapped rows: $($usL2Mapped.Count)/$(@($usLevel2Items).Count)")
[void]$lines.Add("- USA level-3 states with map+data+full mapping: $($usL3Full.Count)")
[void]$lines.Add("- USA level-3 states with map+data but partial mapping: $($usL3Partial.Count)")
[void]$lines.Add("- USA level-3 states with map but no level-3 data snapshot: $($usL3MapNoData.Count)")
[void]$lines.Add("- USA level-3 states with data but no state map: $($usL3DataNoMap.Count)")
[void]$lines.Add('')
[void]$lines.Add('## A) Regional Country Maps (Configured in Code)')
[void]$lines.Add('')
[void]$lines.Add('| Country | Map Asset | Data Available | Data Rows | Mapped Rows | Unmapped Rows | Note |')
[void]$lines.Add('|---|---|---:|---:|---:|---:|---|')
foreach ($row in ($regionalAuditRows | Sort-Object country)) {
  [void]$lines.Add("| $($row.country) | $($row.mapAsset) | $([int]$row.hasData) | $($row.dataRows) | $($row.mappedRows) | $($row.unmappedRows) | $($row.note) |")
}
[void]$lines.Add('')

$regionalUnmappedDetails = @($regionalAuditRows | Where-Object { $_.hasData -and $_.unmappedRows -gt 0 } | Sort-Object country)
if ($regionalUnmappedDetails.Count -gt 0) {
  [void]$lines.Add('### Regional Partial/Unmapped Details')
  [void]$lines.Add('')
  foreach ($row in $regionalUnmappedDetails) {
    [void]$lines.Add("- **$($row.country)** ($($row.mappedRows)/$($row.dataRows) mapped)")
    [void]$lines.Add("  - Unmapped rows: $([string]::Join(', ', $row.unmappedNames))")
  }
  [void]$lines.Add('')
}

[void]$lines.Add('## B) Map Asset Exists but Regional Data Snapshot Not Found')
[void]$lines.Add('')
if ($countriesMapNoData.Count -eq 0) {
  [void]$lines.Add('- None')
} else {
  foreach ($country in ($countriesMapNoData | Sort-Object)) {
    [void]$lines.Add("- $country")
  }
}
[void]$lines.Add('')

[void]$lines.Add('## C) Regional Data Exists but No Configured Map Asset')
[void]$lines.Add('')
if ($countriesDataNoMap.Count -eq 0) {
  [void]$lines.Add('- None')
} else {
  foreach ($country in $countriesDataNoMap) {
    [void]$lines.Add("- $country")
  }
}
[void]$lines.Add('')

[void]$lines.Add('## D) USA Level-2 (States on `usa.svg`)')
[void]$lines.Add('')
[void]$lines.Add("- Mapped rows: $($usL2Mapped.Count)/$(@($usLevel2Items).Count)")
[void]$lines.Add("- Unmapped rows: $([string]::Join(', ', ($usL2Unmapped | Sort-Object)))")
if ($usMapOnlyCodes.Count -gt 0) {
  [void]$lines.Add("- Map-only shapes (no matching data row, by state code): $([string]::Join(', ', ($usMapOnlyCodes | ForEach-Object { $_.ToUpperInvariant() })))")
}
[void]$lines.Add('')

[void]$lines.Add('## E) USA Level-3 (State Subregion Maps)')
[void]$lines.Add('')
[void]$lines.Add('| State | State Code | Map File | Data Available | Data Rows | Mapped Rows | Unmapped Rows |')
[void]$lines.Add('|---|---|---|---:|---:|---:|---:|')
foreach ($row in ($usL3Rows | Sort-Object stateName)) {
  [void]$lines.Add("| $($row.stateName) | $($row.stateCode.ToUpperInvariant()) | $($row.mapFile) | $([int]$row.hasData) | $($row.dataRows) | $($row.mappedRows) | $($row.unmappedRows) |")
}
[void]$lines.Add('')

if ($usL3Partial.Count -gt 0) {
  [void]$lines.Add('### USA Level-3 Partial/Unmapped Details')
  [void]$lines.Add('')
  foreach ($row in ($usL3Partial | Sort-Object stateName)) {
    [void]$lines.Add("- **$($row.stateName)** ($($row.mappedRows)/$($row.dataRows) mapped)")
    [void]$lines.Add("  - Unmapped rows: $([string]::Join(', ', $row.unmappedNames))")
  }
  [void]$lines.Add('')
}

[void]$lines.Add('### USA Level-3 Data/Map Gaps')
[void]$lines.Add('')
[void]$lines.Add('- States with map but no level-3 data snapshot:')
if ($usL3MapNoData.Count -eq 0) {
  [void]$lines.Add('  - None')
} else {
  foreach ($stateName in ($usL3MapNoData | Sort-Object)) {
    [void]$lines.Add("  - $stateName")
  }
}
[void]$lines.Add('- States with level-3 data but no map asset:')
if ($usL3DataNoMap.Count -eq 0) {
  [void]$lines.Add('  - None')
} else {
  foreach ($stateName in ($usL3DataNoMap | Sort-Object)) {
    [void]$lines.Add("  - $stateName")
  }
}
[void]$lines.Add('')

[void]$lines.Add('## Notes for Future Development')
[void]$lines.Add('')
[void]$lines.Add('- This audit distinguishes **name mismatch** from **no-shape entries** (aggregated/offline/cruise/out-of-state categories).')
[void]$lines.Add('- USA level-2 runtime mapping uses explicit state-code binding (`US-XX`) to avoid fuzzy misbinding.')
[void]$lines.Add('- USA level-3 runtime mapping keeps fuzzy matching disabled to prioritize deterministic behavior.')
[void]$lines.Add('- Re-run this audit whenever map assets or `c_data` snapshots are updated.')

$docsDir = Join-Path $repoRoot 'docs'
if (-not (Test-Path $docsDir)) {
  New-Item -Path $docsDir -ItemType Directory | Out-Null
}
$reportPath = Join-Path $docsDir 'map-data-mapping-audit.md'
Set-Content -Path $reportPath -Value ($lines -join "`r`n") -Encoding UTF8

Write-Output "REPORT_WRITTEN: $reportPath"
Write-Output "REGIONAL_PARTIAL_COUNT: $regionalPartial"
Write-Output "US_L2: $($usL2Mapped.Count)/$(@($usLevel2Items).Count)"
Write-Output "US_L3_PARTIAL: $($usL3Partial.Count)"
Write-Output "US_L3_MAP_NO_DATA: $($usL3MapNoData.Count)"
Write-Output "US_L3_DATA_NO_MAP: $($usL3DataNoMap.Count)"
