import pandas as pd
import json
from IPython import embed

with open('illinois-counties.json') as f:
    data = json.load(f)

df = pd.read_csv('all-dists.csv')
counter = 1

obj_list = data['objects']['cb_2015_illinois_county_20m']['geometries']

for d in obj_list:
    row = df.loc[df['name'] == d['properties']['NAME']]
    # if counter == 102:
    #     embed()
    old_dist = row.iloc[0].at['old_dist']
    d['properties']['OLDDIST'] = str(old_dist).replace('.0', '')

    new_dist = row.iloc[0].at['new_dist']
    d['properties']['NEWDIST'] = str(new_dist).replace('.0', '')

    print(str(counter) + '. ' + d['properties']['NAME'])
    counter += 1

data['objects']['cb_2015_illinois_county_20m']['geometries'] = obj_list

with open("illinois-all-dist.json", "w") as outfile:
    json.dump(data, outfile)

##topomerge old_dists=cb_2015_illinois_county_20m -k "d.properties.OLDDIST" < illinois-all-dist.json > illinois-old-only.json
##topomerge new_dists=cb_2015_illinois_county_20m -k "d.properties.NEWDIST" < illinois-old-only.json > illinois-complete.json
