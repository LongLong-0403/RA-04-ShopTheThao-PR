"""Execute the generated collection requests in a disposable database."""
import json
import re
from uuid import uuid4
from pathlib import Path
from test_api import app, get_db, settings, statements, KW
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pymysql

name='postman_verify_'+uuid4().hex
conn=pymysql.connect(**KW)
engine=None
try:
    with conn.cursor() as cur:
        source=Path(__file__).with_name('sport_store_demo.sql').read_text(encoding='utf-8').replace('`sport_store_db`',f'`{name}`')
        for sql in statements(source):
            cur.execute(sql)
            while cur.nextset(): pass
    engine=create_engine(settings.database_url.rsplit('/',1)[0]+'/'+name+'?charset=utf8mb4')
    from app.models.item import Item
    Item.__table__.create(engine)
    factory=sessionmaker(engine)
    def override():
        with factory() as db: yield db
    app.dependency_overrides[get_db]=override
    client=TestClient(app)
    collection=json.loads((Path(__file__).resolve().parents[2]/'ShopTheThao_API_Test.postman_collection.json').read_text(encoding='utf-8'))
    values={v['key']:v['value'] for v in collection['variable']}
    # Provision collection credentials only inside this disposable database.
    from app.models.user import User, UserRole, UserStatus
    from app.core.security import hash_password
    from sqlalchemy import select
    with factory() as db:
        admin = db.scalar(select(User).where(User.email == values['admin_email']))
        if admin is None:
            db.add(User(email=values['admin_email'], password_hash=hash_password(values['admin_password']),
                        full_name='Collection test admin', phone='0900000002',
                        role=UserRole.ADMIN, status=UserStatus.ACTIVE))
            db.commit()
    values['run_id']=uuid4().hex[:12]
    def render(s):
        return re.sub(r'\{\{(\w+)\}\}',lambda m:str(values[m[1]]),s)
    for item in collection['item']:
        request=item['request']
        path=render(request['url']).replace(values['base_url'],'',1)
        kwargs={}
        if request['auth']['type']=='bearer':
            kwargs['headers']={'Authorization':'Bearer '+render(request['auth']['bearer'][0]['value'])}
        if 'body' in request:
            data=json.loads(render(request['body']['raw']))
            for key in data:
                if key.endswith('_id') and data[key] is not None: data[key]=int(data[key])
            kwargs['json']=data
        response=client.request(request['method'],path,**kwargs)
        script='\n'.join(item['event'][0]['script']['exec'])
        expected=int(re.search(r'HTTP (\d+)',script)[1])
        assert response.status_code==expected,(item['name'],expected,response.status_code,response.text)
        for variable,field in re.findall(r'collectionVariables.set\("(\w+)", pm.response.json\(\).(\w+)\)',script):
            values[variable]=response.json()[field]
    print(f'PASS: {len(collection["item"])} collection requests on disposable MySQL database')
finally:
    app.dependency_overrides.clear()
    if engine: engine.dispose()
    with conn.cursor() as cur: cur.execute(f'DROP DATABASE IF EXISTS `{name}`')
    conn.close()
