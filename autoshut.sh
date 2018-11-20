
ps aux|grep stf|awk '{print $2}'|xargs kill
