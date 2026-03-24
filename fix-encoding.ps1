$files = Get-ChildItem -Path app, lib -Recurse -Include *.ts, *.tsx

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $content = $content -replace ([char]0xC3 + [char]0xAD), 'í'
    $content = $content -replace ([char]0xC3 + [char]0xB3), 'ó'
    $content = $content -replace ([char]0xC3 + [char]0xB1), 'ñ'
    $content = $content -replace ([char]0xC3 + [char]0xA1), 'á'
    $content = $content -replace ([char]0xC3 + [char]0xA9), 'é'
    $content = $content -replace ([char]0xC3 + [char]0xBA), 'ú'
    $content = $content -replace ([char]0xC3 + [char]0x97), '×'
    $content = $content -replace ([char]0xE2 + [char]0x80 + [char]0xA6), '…'
    $content = $content -replace ([char]0xE2 + [char]0x86 + [char]0x92), '→'
    $content = $content -replace ([char]0xC2 + [char]0xAB), '«'
    $content = $content -replace ([char]0xC2 + [char]0xBB), '»'
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Output "OK $($file.Name)"
}