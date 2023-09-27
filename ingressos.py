import pyautogui as pg
import time

#infos
user = "igorcalabraro"
pword = "123"

#delay
pg.PAUSE = 1

#funções [
#   .write - escrever texto
#   .press - apertar 1 tecla
#   .click - clicar no x,y
#   .hotkey - apertar 2 teclas
# ]

pg.press('winleft')
pg.write('chrome')
pg.press('enter')

time.sleep(3)

pg.write('https://www.ingressoscorinthians.com.br/login.asp')
pg.press('enter')

time.sleep(3)

pg.click(x=704, y=461)
pg.write(user)
pg.press('tab')
pg.write(pword)
pg.press('tab')
pg.press('space')
pg.press('tab')
pg.press('tab')
pg.press('tab')
pg.press('enter')
