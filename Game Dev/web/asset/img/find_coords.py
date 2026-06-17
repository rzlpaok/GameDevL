import cv2

wireframe_org = cv2.imread('wireframe.png', cv2.IMREAD_UNCHANGED)
wireframe = cv2.resize(wireframe_org, (3840, 2160))

templates = [
    'monitor_144x139.png',
    'keyboard_208x32.png',
    'ipad_66x31.png',
    'jam_73x42.png',
    'tombolbuku_16x144.png'
]

def find_template(template_name):
    template = cv2.imread(template_name, cv2.IMREAD_UNCHANGED)
    
    if template.shape[2] == 4:
        tmpl_img = template[:, :, :3]
        tmpl_mask = template[:, :, 3]
    else:
        tmpl_img = template
        tmpl_mask = None
        
    wire_img = wireframe[:, :, :3]
    
    result = cv2.matchTemplate(wire_img, tmpl_img, cv2.TM_CCORR_NORMED, mask=tmpl_mask)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
    
    # max_loc is the (x,y) at 3840x2160 scale.
    # The user wants positions at 384x216 scale. So we divide by 10.
    return (max_loc[0] / 10.0, max_loc[1] / 10.0), max_val

for t in templates:
    loc, val = find_template(t)
    print(f"{t}: {loc} (score: {val:.3f})")
