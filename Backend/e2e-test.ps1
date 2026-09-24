$ErrorActionPreference = 'Stop'
$env:PGPASSWORD = '123454321'
$base = 'http://127.0.0.1:3000'

# 1) signup
$email = "dbg2_$(Get-Random).x@x.com"
$sg = "$env:TEMP\sg.json"
@{ email = $email; password = 'Password123'; displayName = 'Dbg' } | ConvertTo-Json -Compress | Set-Content $sg -Encoding UTF8
Write-Host 'signup:'
$signup = curl.exe --noproxy '*' -s -X POST "$base/api/auth/signup" -H 'Content-Type: application/json' --data-binary "@$sg"
$signup | Write-Host
$tok = (ConvertFrom-Json $signup).accessToken

# 2) usage free
Write-Host "`nusage(free):"
curl.exe --noproxy '*' -s "$base/api/billing/usage" -H "Authorization: Bearer $tok" | Write-Host

# 3) exhaust the free trial directly in the DB
psql -h localhost -U postgres -d 'Social Yolo' -X -q -P pager=off "UPDATE users SET credits_used = 3 WHERE email = '$email';" 2>&1 | Out-Null

# 4) generate -> expect 402 TRIAL_EXHAUSTED
Write-Host "`ngenerate (trial exhausted, expect 402):"
curl.exe --noproxy '*' -s -X POST "$base/api/posts/generate" -H "Authorization: Bearer $tok" -F prompt=hi | Write-Host

# 5) subscribe -> pro, then usage, then generate no longer 402
Write-Host "`nsubscribe:"
curl.exe --noproxy '*' -s -X POST "$base/api/billing/subscribe" -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' --data-binary '{}' | Write-Host
Write-Host "usage(pro):"
curl.exe --noproxy '*' -s "$base/api/billing/usage" -H "Authorization: Bearer $tok" | Write-Host
Write-Host "generate(no token, expect 401):"
curl.exe --noproxy '*' -s -o NUL -w '  -> %{http_code}' -X POST "$base/api/posts/generate" -F prompt=hi; Write-Host
Write-Host "generate(after pro, expect NOT 402/401):"
curl.exe --noproxy '*' -s -o NUL -w '  -> %{http_code}' -X POST "$base/api/posts/generate" -H "Authorization: Bearer $tok" -F prompt=hi; Write-Host
