export const TEMPLATE_CONTENT = {
  generic: `\\documentclass[12pt,a4paper]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{hyperref}
\\usepackage{url}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{authblk}
\\usepackage{abstract}
\\usepackage{titlesec}
\\usepackage{parskip}
\\usepackage{xcolor}

<<preamble_extras>>

\\title{<<title>>}

\\author{<<authors>>}

\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
<<abstract>>
\\end{abstract}

\\tableofcontents
\\newpage

\\section{Introduction}
\\label{sec:intro}

<<introduction>>

\\section{Related Work}
\\label{sec:related}

<<related_work>>

\\section{Methodology}
\\label{sec:methodology}

<<methodology>>

\\section{Experiments \\& Results}
\\label{sec:experiments}

<<experiments>>

\\section{Discussion}
\\label{sec:discussion}

<<results>>

\\section{Conclusion}
\\label{sec:conclusion}

<<conclusion>>

\\section*{Acknowledgments}

<<acknowledgments>>

\\begin{thebibliography}{99}
<<references>>
\\end{thebibliography}

\\end{document}
`,
  neurips: `\\documentclass{article}

% NeurIPS 2025 style approximation
\\usepackage[preprint]{neurips_2025}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{url}
\\usepackage{booktabs}
\\usepackage{amsfonts}
\\usepackage{amsmath}
\\usepackage{nicefrac}
\\usepackage{microtype}
\\usepackage{xcolor}
\\usepackage{graphicx}

<<preamble_extras>>

\\title{<<title>>}

\\author{<<authors>>}

\\begin{document}

\\maketitle

\\begin{abstract}
<<abstract>>
\\end{abstract}

\\section{Introduction}
\\label{sec:intro}

<<introduction>>

\\section{Related Work}
\\label{sec:related}

<<related_work>>

\\section{Methodology}
\\label{sec:method}

<<methodology>>

\\section{Experiments}
\\label{sec:experiments}

<<experiments>>

\\section{Results}
\\label{sec:results}

<<results>>

\\section{Conclusion}
\\label{sec:conclusion}

<<conclusion>>

\\section*{Acknowledgments}

<<acknowledgments>>

\\bibliographystyle{plain}
\\bibliography{references}

<<references>>

\\end{document}
`,
} as const
