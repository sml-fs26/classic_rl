.PHONY: all handout clean

all: lecture_rl.pdf

lecture_rl.pdf: lecture_rl.tex slides.tex title.tex week_rl.tex ../topics/rl/rl.tex
	latexmk -pdf lecture_rl.tex

handout: lecture_rl_handout.pdf

lecture_rl_handout.pdf: lecture_rl.tex slides.tex title.tex week_rl.tex ../topics/rl/rl.tex
	pdflatex --jobname=lecture_rl_handout "\PassOptionsToClass{handout}{beamer}\input{lecture_rl.tex}"
	pdflatex --jobname=lecture_rl_handout "\PassOptionsToClass{handout}{beamer}\input{lecture_rl.tex}"
	pdfjam --suffix nup --a4paper --keepinfo --nup 2x2 --frame false --delta "2mm 14mm" --scale 0.98 --landscape --outfile lecture_rl_2x2handout.pdf lecture_rl_handout.pdf

clean:
	rm -f *.aux *.toc *.log *.nav *.glo *.out *.snm *.vrb *.bbl *.blg *.bak *.synctex* *.*latexmk *.fls
