# process the tsv file by removing categories i don't want and such so it's able to load


import csv

g = open('../data/cpes-condensed.tsv', 'w')

t = open('../data/test.tsv', 'w')

variablesOfInterest = dict()

a = 0
with open("../data/cpes.tsv") as tsv:
    #for line in csv.reader(tsv, dialect="excel-tab"):
    for line in tsv:
        a += 1
        if a == 500:
            break
        t.write(line)
print a
print("lskdjf")

varNames = dict()
with open('variables2.txt', 'r') as theVars:
    a = 0
    for line in theVars:
        theSplit = line.split()
        print theSplit[0]
        varNames[theSplit[0]] = theSplit[1]
        variablesOfInterest[theSplit[0]] = 1
        #variablesOfInterest[line[:len(line)-1]] = 1
        a += 1

def fil(x):
    if varSplit[x] in variablesOfInterest:
        return 1
    return 0
varSplit = None

a = 0
print "sldkj"

with open("../data/cpes.tsv") as tsv:
    variables = next(tsv)
    varSplit = variables.split()
    varBools = map(fil, range(0, len(varSplit)))

    for i in range(0, len(varSplit)):
        if varBools[i]:
            g.write(str(varNames[varSplit[i]]) + "\t")
    g.write("\n")

    for line in csv.reader(tsv, dialect="excel-tab"): #You can also use delimiter="\t" rather than giving a dialect.
        a += 1
        #if a == 1500:
            #break
        for i in range(0, len(line)):
            if varBools[i]:
                g.write(str(line[i]) + "\t")
        g.write("\n")

#print a