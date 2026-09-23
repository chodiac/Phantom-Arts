# Simple, resilient static file server for local preview.
# Usage:  ./serve.ps1   ->   http://localhost:5173
#
# Single-threaded but exception-proof: it never dies on a client
# disconnect. For production use any real static host (nginx, Netlify,
# Vercel, GitHub Pages, ...). The files are plain static assets.
param([int]$Port = 5173)

$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8";
  ".js"="text/javascript; charset=utf-8"; ".mjs"="text/javascript; charset=utf-8";
  ".json"="application/json; charset=utf-8"; ".webmanifest"="application/manifest+json; charset=utf-8";
  ".mp4"="video/mp4"; ".webm"="video/webm";
  ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".png"="image/png";
  ".webp"="image/webp"; ".gif"="image/gif"; ".svg"="image/svg+xml";
  ".woff"="font/woff"; ".woff2"="font/woff2"; ".ico"="image/x-icon"; ".txt"="text/plain; charset=utf-8"
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Host "Phantom Arts -> http://localhost:$Port/  (Ctrl+C to stop)"

while ($listener.IsListening) {
  $ctx = $null
  try { $ctx = $listener.GetContext() } catch { continue }
  try {
    $ctx.Response.KeepAlive = $false
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
    $rel  = $rel -replace '/', [IO.Path]::DirectorySeparatorChar
    $file = [IO.Path]::GetFullPath((Join-Path $root $rel))

    if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
      $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()
      $ctx.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' })
      $ctx.Response.Headers['Cache-Control'] = 'no-store'
      $ctx.Response.Headers['Accept-Ranges'] = 'bytes'
      $bytes = [IO.File]::ReadAllBytes($file)
      $total = $bytes.Length

      # honor Range requests (needed for <video> seeking — without this,
      # browsers treat the resource as non-seekable even once fully buffered)
      $range = $ctx.Request.Headers['Range']
      if ($range -and $range -match '^bytes=(\d*)-(\d*)$') {
        $start = if ($Matches[1]) { [int64]$Matches[1] } else { 0 }
        $end   = if ($Matches[2]) { [int64]$Matches[2] } else { $total - 1 }
        if ($end -gt $total - 1) { $end = $total - 1 }
        $len = $end - $start + 1
        $ctx.Response.StatusCode = 206
        $ctx.Response.Headers['Content-Range'] = "bytes $start-$end/$total"
        $ctx.Response.ContentLength64 = $len
        $ctx.Response.OutputStream.Write($bytes, $start, $len)
      } else {
        $ctx.Response.ContentLength64 = $total
        $ctx.Response.OutputStream.Write($bytes, 0, $total)
      }
    } else {
      $ctx.Response.StatusCode = 404
      $b = [Text.Encoding]::UTF8.GetBytes("404 - $rel")
      $ctx.Response.ContentLength64 = $b.Length
      $ctx.Response.OutputStream.Write($b, 0, $b.Length)
    }
  } catch {
  } finally {
    if ($ctx) { try { $ctx.Response.OutputStream.Close(); $ctx.Response.Close() } catch {} }
  }
}
