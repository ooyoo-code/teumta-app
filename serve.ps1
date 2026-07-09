param(
    [int]$Port = 5500,
    [string]$Root = (Get-Location).Path
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root on http://localhost:$Port/"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    $path = $req.Url.LocalPath
    if ($path.EndsWith("/")) { $path = $path + "index.html" }
    $filePath = Join-Path $Root $path.TrimStart("/")

    if (Test-Path $filePath -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath)
        $contentType = switch ($ext) {
            ".html" { "text/html" }
            ".css"  { "text/css" }
            ".js"   { "application/javascript" }
            ".json" { "application/json" }
            ".svg"  { "image/svg+xml" }
            ".png"  { "image/png" }
            default { "application/octet-stream" }
        }
        $res.ContentType = $contentType
        $res.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $res.StatusCode = 404
    }
    $res.OutputStream.Close()
}
