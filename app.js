// GitHub API 基础 URL
const GITHUB_API = "https://api.github.com"

// 当前活动的标签页
let currentTab = "single"

// 当前语言
let currentLanguage = "zh"

// Translation dictionary
const translations = {
  zh: {
    pageTitle: "GitHub Commit Diff Viewer",
    langBtn: "English",
    tabSingle: "单个 Commit",
    tabRange: "时间范围",
    labelCommitUrl: "Commit URL:",
    labelCommitsUrl: "Commits URL:",
    labelSingleFilename: "文件名:",
    labelRangeFilename: "文件名:",
    labelDateRange: "时间范围:",
    labelStartDate: "开始日期:",
    labelEndDate: "结束日期:",
    btnViewDiff: "查看差异",
    loadingText: "正在加载...",
    errorFillFields: "请填写 Commit URL 和文件名",
    errorInvalidCommitUrl: "无效的 Commit URL",
    errorInvalidCommitsUrl: "无效的 Commits URL",
    errorFillFieldsRange: "请填写 Commits URL 和文件名",
    errorSelectDateRange: "请选择时间范围",
    errorPrefix: "错误: ",
    infoFileNotFound: "在此 commit 中没有找到文件: ",
    infoNoCommits: "在指定时间范围内没有找到 commits",
    infoNoChanges: "在 {count} 个 commits 中没有找到对文件 {filename} 的修改",
    noDiffFound: "没有找到差异",
    cannotGetDiff: "无法获取文件差异",
    processingCommits: "正在处理 commits: ",
    by: " by ",
    on: " on ",
    placeholderCommitUrl: "https://github.com/owner/repo/commit/sha",
    placeholderCommitsUrl: "https://github.com/owner/repo/commits",
    placeholderFilename: "notes.txt",
  },
  en: {
    pageTitle: "GitHub Commit Diff Viewer",
    langBtn: "中文",
    tabSingle: "Single Commit",
    tabRange: "Date Range",
    labelCommitUrl: "Commit URL:",
    labelCommitsUrl: "Commits URL:",
    labelSingleFilename: "Filename:",
    labelRangeFilename: "Filename:",
    labelDateRange: "Date Range:",
    labelStartDate: "Start Date:",
    labelEndDate: "End Date:",
    btnViewDiff: "View Diff",
    loadingText: "Loading...",
    errorFillFields: "Please fill in Commit URL and filename",
    errorInvalidCommitUrl: "Invalid Commit URL",
    errorInvalidCommitsUrl: "Invalid Commits URL",
    errorFillFieldsRange: "Please fill in Commits URL and filename",
    errorSelectDateRange: "Please select date range",
    errorPrefix: "Error: ",
    infoFileNotFound: "File not found in this commit: ",
    infoNoCommits: "No commits found in the specified date range",
    infoNoChanges: "No changes to file {filename} found in {count} commits",
    noDiffFound: "No differences found",
    cannotGetDiff: "Cannot retrieve file differences",
    processingCommits: "Processing commits: ",
    by: " by ",
    on: " on ",
    placeholderCommitUrl: "https://github.com/owner/repo/commit/sha",
    placeholderCommitsUrl: "https://github.com/owner/repo/commits",
    placeholderFilename: "notes.txt",
  },
}

// Get translation text
function t(key) {
  return translations[currentLanguage][key] || key
}

// Toggle language
function toggleLanguage() {
  currentLanguage = currentLanguage === "zh" ? "en" : "zh"
  localStorage.setItem("github-diff-viewer-lang", currentLanguage)
  updateUILanguage()
}

// Update UI language
function updateUILanguage() {
  document.getElementById("page-title").textContent = t("pageTitle")
  document.getElementById("lang-btn").textContent = t("langBtn")
  document.getElementById("tab-single").textContent = t("tabSingle")
  document.getElementById("tab-range").textContent = t("tabRange")
  document.getElementById("label-commit-url").textContent = t("labelCommitUrl")
  document.getElementById("label-commits-url").textContent = t("labelCommitsUrl")
  document.getElementById("label-single-filename").textContent = t("labelSingleFilename")
  document.getElementById("label-range-filename").textContent = t("labelRangeFilename")
  document.getElementById("label-date-range").textContent = t("labelDateRange")
  document.getElementById("label-start-date").textContent = t("labelStartDate")
  document.getElementById("label-end-date").textContent = t("labelEndDate")
  document.getElementById("single-submit").textContent = t("btnViewDiff")
  document.getElementById("range-submit").textContent = t("btnViewDiff")
  document.getElementById("loading-text").textContent = t("loadingText")

  // Update placeholders
  document.getElementById("commit-url").placeholder = t("placeholderCommitUrl")
  document.getElementById("commits-url").placeholder = t("placeholderCommitsUrl")
  document.getElementById("single-filename").placeholder = t("placeholderFilename")
  document.getElementById("range-filename").placeholder = t("placeholderFilename")

  // Update HTML lang attribute
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en"
}

// 切换标签页
function switchTab(tab) {
  currentTab = tab

  // 更新标签按钮状态
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"))
  event.target.classList.add("active")

  // 更新内容显示
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"))
  document.getElementById(`${tab}-tab`).classList.add("active")

  // 清空结果
  clearResults()
}

// 清空结果
function clearResults() {
  document.getElementById("results").innerHTML = ""
  document.getElementById("progress").style.display = "none"
}

// 显示加载状态
function showLoading(show) {
  document.getElementById("loading").style.display = show ? "block" : "none"
}

// 显示错误信息
function showError(message) {
  const resultsDiv = document.getElementById("results")
  resultsDiv.innerHTML = `<div class="error">${message}</div>`
}

// 显示信息
function showInfo(message) {
  const resultsDiv = document.getElementById("results")
  resultsDiv.innerHTML = `<div class="info">${message}</div>`
}

// 解析 GitHub URL
function parseGitHubUrl(url) {
  const commitMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/commit\/([a-f0-9]+)/)
  if (commitMatch) {
    return {
      type: "commit",
      owner: commitMatch[1],
      repo: commitMatch[2],
      sha: commitMatch[3],
    }
  }

  const commitsMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/commits/)
  if (commitsMatch) {
    return {
      type: "commits",
      owner: commitsMatch[1],
      repo: commitsMatch[2],
    }
  }

  return null
}

// 获取 commit 数据
async function getCommitData(owner, repo, sha) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits/${sha}`)
  if (!response.ok) {
    throw new Error(`GitHub API ${t("errorPrefix")}${response.status} ${response.statusText}`)
  }
  return await response.json()
}

// 获取 commits 列表
async function getCommitsList(owner, repo, since, until, page = 1) {
  let url = `${GITHUB_API}/repos/${owner}/${repo}/commits?page=${page}&per_page=100`
  if (since) url += `&since=${since}`
  if (until) url += `&until=${until}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`GitHub API ${t("errorPrefix")}${response.status} ${response.statusText}`)
  }
  return await response.json()
}

// 生成简单的 diff
function generateSimpleDiff(oldContent, newContent) {
  const oldLines = oldContent ? oldContent.split("\n") : []
  const newLines = newContent ? newContent.split("\n") : []

  // 使用最长公共子序列算法
  const diff = computeDiff(oldLines, newLines)
  return diff
}

// 计算 diff（简化版 Myers 算法）
function computeDiff(oldLines, newLines) {
  const result = []
  let i = 0,
    j = 0

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      // 相同行
      result.push({ type: "context", oldLine: i + 1, newLine: j + 1, content: oldLines[i] })
      i++
      j++
    } else {
      // 找到下一个匹配点
      let matchFound = false

      // 尝试在接下来的几行中找到匹配
      for (let lookAhead = 1; lookAhead <= 5; lookAhead++) {
        if (i + lookAhead < oldLines.length && j < newLines.length && oldLines[i + lookAhead] === newLines[j]) {
          // 删除行
          for (let k = 0; k < lookAhead; k++) {
            result.push({ type: "remove", oldLine: i + 1, newLine: null, content: oldLines[i] })
            i++
          }
          matchFound = true
          break
        }

        if (i < oldLines.length && j + lookAhead < newLines.length && oldLines[i] === newLines[j + lookAhead]) {
          // 添加行
          for (let k = 0; k < lookAhead; k++) {
            result.push({ type: "add", oldLine: null, newLine: j + 1, content: newLines[j] })
            j++
          }
          matchFound = true
          break
        }
      }

      if (!matchFound) {
        // 没找到匹配，判断是删除还是添加
        if (i < oldLines.length && j < newLines.length) {
          // 同时存在，视为修改（删除+添加）
          result.push({ type: "remove", oldLine: i + 1, newLine: null, content: oldLines[i] })
          result.push({ type: "add", oldLine: null, newLine: j + 1, content: newLines[j] })
          i++
          j++
        } else if (i < oldLines.length) {
          // 只有旧行，删除
          result.push({ type: "remove", oldLine: i + 1, newLine: null, content: oldLines[i] })
          i++
        } else {
          // 只有新行，添加
          result.push({ type: "add", oldLine: null, newLine: j + 1, content: newLines[j] })
          j++
        }
      }
    }
  }

  return result
}

// 渲染 diff
function renderDiff(diff, contextLines = 3) {
  if (!diff || diff.length === 0) {
    return `<div class="no-changes">${t("noDiffFound")}</div>`
  }

  let html = '<div class="diff-container"><table class="diff-table">'

  // 只显示有变化的行及其上下文
  const changedIndices = diff.map((line, idx) => (line.type !== "context" ? idx : -1)).filter((idx) => idx !== -1)

  if (changedIndices.length === 0) {
    return `<div class="no-changes">${t("noDiffFound")}</div>`
  }

  // 计算需要显示的行范围
  const showIndices = new Set()
  changedIndices.forEach((idx) => {
    for (let i = Math.max(0, idx - contextLines); i <= Math.min(diff.length - 1, idx + contextLines); i++) {
      showIndices.add(i)
    }
  })

  const sortedIndices = Array.from(showIndices).sort((a, b) => a - b)

  let lastIdx = -10
  sortedIndices.forEach((idx) => {
    // 如果跳过了一些行，显示省略标记
    if (idx - lastIdx > 1) {
      html +=
        '<tr class="diff-hunk"><td class="line-number">...</td><td class="line-number">...</td><td class="line-content">...</td></tr>'
    }

    const line = diff[idx]
    const oldLineNum = line.oldLine || ""
    const newLineNum = line.newLine || ""
    const content = escapeHtml(line.content)

    let rowClass = ""
    if (line.type === "add") {
      rowClass = "diff-add"
    } else if (line.type === "remove") {
      rowClass = "diff-remove"
    } else {
      rowClass = "diff-context"
    }

    html += `<tr class="${rowClass}">
            <td class="line-number">${oldLineNum}</td>
            <td class="line-number">${newLineNum}</td>
            <td class="line-content">${content}</td>
        </tr>`

    lastIdx = idx
  })

  html += "</table></div>"
  return html
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// 渲染 commit 块
function renderCommitBlock(commitData, filename, diff) {
  const date = new Date(commitData.commit.author.date).toLocaleString(currentLanguage === "zh" ? "zh-CN" : "en-US")
  const author = commitData.commit.author.name
  const message = escapeHtml(commitData.commit.message)
  const sha = commitData.sha.substring(0, 7)
  const url = commitData.html_url

  return `
        <div class="commit-block">
            <div class="commit-header">
                <div class="commit-title">${message}</div>
                <div class="commit-meta">
                    <a href="${url}" target="_blank">${sha}</a>${t("by")}${author}${t("on")}${date}
                </div>
            </div>
            ${diff}
        </div>
    `
}

// 查看单个 commit
async function fetchSingleCommit() {
  const commitUrl = document.getElementById("commit-url").value.trim()
  const filename = document.getElementById("single-filename").value.trim()

  if (!commitUrl || !filename) {
    showError(t("errorFillFields"))
    return
  }

  const parsed = parseGitHubUrl(commitUrl)
  if (!parsed || parsed.type !== "commit") {
    showError(t("errorInvalidCommitUrl"))
    return
  }

  clearResults()
  showLoading(true)

  try {
    const commitData = await getCommitData(parsed.owner, parsed.repo, parsed.sha)

    // 查找指定文件
    const file = commitData.files.find((f) => f.filename === filename)

    if (!file) {
      showInfo(t("infoFileNotFound") + filename)
      return
    }

    // 获取文件内容并生成 diff
    let diffHtml
    if (file.patch) {
      // 如果有 patch，解析它
      diffHtml = renderPatch(file.patch)
    } else if (file.status === "added") {
      // 新增文件
      const content = await getFileContent(parsed.owner, parsed.repo, parsed.sha, filename)
      const diff = generateSimpleDiff("", content)
      diffHtml = renderDiff(diff, 1000) // 显示所有行
    } else if (file.status === "removed") {
      // 删除文件
      const content = await getFileContent(parsed.owner, parsed.repo, `${parsed.sha}^`, filename)
      const diff = generateSimpleDiff(content, "")
      diffHtml = renderDiff(diff, 1000)
    } else {
      diffHtml = `<div class="no-changes">${t("cannotGetDiff")}</div>`
    }

    const html = renderCommitBlock(commitData, filename, diffHtml)
    document.getElementById("results").innerHTML = html
  } catch (error) {
    showError(t("errorPrefix") + error.message)
  } finally {
    showLoading(false)
  }
}

// 渲染 patch（GitHub API 返回的 patch 格式）
function renderPatch(patch) {
  const lines = patch.split("\n")
  let html = '<div class="diff-container"><table class="diff-table">'

  let oldLine = 0
  let newLine = 0

  lines.forEach((line) => {
    if (line.startsWith("@@")) {
      // Hunk 头
      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/)
      if (match) {
        oldLine = Number.parseInt(match[1])
        newLine = Number.parseInt(match[2])
      }
      html += `<tr class="diff-hunk"><td class="line-number"></td><td class="line-number"></td><td class="line-content">${escapeHtml(line)}</td></tr>`
    } else if (line.startsWith("+")) {
      // 添加行
      html += `<tr class="diff-add"><td class="line-number"></td><td class="line-number">${newLine}</td><td class="line-content">${escapeHtml(line)}</td></tr>`
      newLine++
    } else if (line.startsWith("-")) {
      // 删除行
      html += `<tr class="diff-remove"><td class="line-number">${oldLine}</td><td class="line-number"></td><td class="line-content">${escapeHtml(line)}</td></tr>`
      oldLine++
    } else if (line.startsWith(" ") || line === "") {
      // 上下文行
      html += `<tr class="diff-context"><td class="line-number">${oldLine}</td><td class="line-number">${newLine}</td><td class="line-content">${escapeHtml(line)}</td></tr>`
      oldLine++
      newLine++
    }
  })

  html += "</table></div>"
  return html
}

// 获取文件内容
async function getFileContent(owner, repo, ref, path) {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`)
    if (!response.ok) return ""
    const data = await response.json()
    return atob(data.content) // Base64 解码
  } catch (error) {
    return ""
  }
}

// 查看时间范围内的 commits
async function fetchCommitRange() {
  const commitsUrl = document.getElementById("commits-url").value.trim()
  const filename = document.getElementById("range-filename").value.trim()
  const startDate = document.getElementById("start-date").value
  const endDate = document.getElementById("end-date").value

  if (!commitsUrl || !filename) {
    showError(t("errorFillFieldsRange"))
    return
  }

  if (!startDate || !endDate) {
    showError(t("errorSelectDateRange"))
    return
  }

  const parsed = parseGitHubUrl(commitsUrl)
  if (!parsed || parsed.type !== "commits") {
    showError(t("errorInvalidCommitsUrl"))
    return
  }

  clearResults()
  showLoading(true)

  // 禁用提交按钮
  const submitBtn = document.getElementById("range-submit")
  submitBtn.disabled = true

  try {
    // 转换日期格式
    const since = new Date(startDate).toISOString()
    const until = new Date(endDate + "T23:59:59").toISOString()

    // 获取 commits 列表
    const commits = await getCommitsList(parsed.owner, parsed.repo, since, until)

    if (commits.length === 0) {
      showInfo(t("infoNoCommits"))
      return
    }

    showLoading(false)

    // 显示进度
    const progressDiv = document.getElementById("progress")
    progressDiv.style.display = "block"
    progressDiv.innerHTML = `
            <div class="progress">
                <div>${t("processingCommits")}<span id="progress-text">0 / ${commits.length}</span></div>
                <div class="progress-bar">
                    <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
        `

    const resultsDiv = document.getElementById("results")
    let foundCount = 0

    // 逐个处理 commits
    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i]

      // 更新进度
      document.getElementById("progress-text").textContent = `${i + 1} / ${commits.length}`
      document.getElementById("progress-fill").style.width = `${((i + 1) / commits.length) * 100}%`

      try {
        // 获取详细的 commit 数据
        const commitData = await getCommitData(parsed.owner, parsed.repo, commit.sha)

        // 查找指定文件
        const file = commitData.files.find((f) => f.filename === filename)

        if (file) {
          foundCount++

          // 生成 diff
          let diffHtml
          if (file.patch) {
            diffHtml = renderPatch(file.patch)
          } else if (file.status === "added") {
            const content = await getFileContent(parsed.owner, parsed.repo, commit.sha, filename)
            const diff = generateSimpleDiff("", content)
            diffHtml = renderDiff(diff, 1000)
          } else if (file.status === "removed") {
            const content = await getFileContent(parsed.owner, parsed.repo, `${commit.sha}^`, filename)
            const diff = generateSimpleDiff(content, "")
            diffHtml = renderDiff(diff, 1000)
          } else {
            diffHtml = `<div class="no-changes">${t("cannotGetDiff")}</div>`
          }

          // 立即显示结果
          const html = renderCommitBlock(commitData, filename, diffHtml)
          resultsDiv.innerHTML += html
        }

        // 延迟以避免触发 GitHub API 限制
        if (i < commits.length - 1) {
          await sleep(1000) // 每个请求间隔 1 秒
        }
      } catch (error) {
        console.error(`${t("errorPrefix")}commit ${commit.sha}:`, error)
      }
    }

    // 隐藏进度条
    progressDiv.style.display = "none"

    if (foundCount === 0) {
      const message = t("infoNoChanges").replace("{count}", commits.length).replace("{filename}", filename)
      showInfo(message)
    }
  } catch (error) {
    showError(t("errorPrefix") + error.message)
  } finally {
    showLoading(false)
    submitBtn.disabled = false
  }
}

// 延迟函数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("github-diff-viewer-lang")
  if (savedLang && (savedLang === "zh" || savedLang === "en")) {
    currentLanguage = savedLang
  }
  updateUILanguage()

  // 设置默认日期（最近 30 天）
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  document.getElementById("end-date").valueAsDate = endDate
  document.getElementById("start-date").valueAsDate = startDate
})
