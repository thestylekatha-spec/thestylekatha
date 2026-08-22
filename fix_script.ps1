$file = "C:\Users\nvnre\Downloads\jewelleryshop\index.html"
$content = [System.IO.File]::ReadAllText($file)
# Replace the leftover base64 between loader-logo"> and <span class="logo-word"
$content = $content -replace 'class="loader-logo">[^<]+<span class="logo-word"', 'class="loader-logo"><span class="logo-word"'
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Fixed"