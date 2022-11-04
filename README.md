pcms-backpop
===

A [payloadcms](https://github.com/payloadcms/payload) plugin for backpropagated relationships.

## Motivation

PayloadCMS is one of the fastest-growing, most developer friendly and largely unopinionated headless CMS for Web, Mobile and other applications. 
Given that it was built on MongoDB it allows for unstructured data to be connected on document level, much like you would imagine a directed graph. 
While this approach is very flexible and works well with their advanced query interfaces it can be expensive to traverse relationships in the opposite 
direction. Assume collection `A` holds a many-to-many relationship to collection `B`.
To find out every `B` given an `A` you can simply query the relationship field and the operation should be linear in the number of `B` documents. The 
composite query however (every `A` documents, given `B`) will be much slower as for every document `A` each related `B` needs to be compared with the 
query element and this complexity worsens with the number of related object types in the query input. Much of this issue is compensated with database-level
optimizations and powerful hardware for now, however, it is to be expected that for large datasets the problem will be noticeable. 

There is another piece of motivation at work too: Developer Experience. If the `Project` collection holds a relationship to `Person`, 
indicating the collaborators of a given project, then it is obvious how to get the set of persons involved in a project, but to find all projects a given
person was working on you need to fabricate a find-query with reversed lookup on the collaborators-field. By using this plugin I hope to make the 
inverse relationship just as straight forward.

## State of the project

The current state can be best described as ***do not try this at home or at all***, especiall NOT IN PRODUCTION. 
While progress is not as fast as I hoped, it is steady and I am pushing for an initial stable release soon.

As of now you can:
 - Check out the project and manually test backpropagation in the payload admin dashboard
 - Have simple relationships backpropagated
 - Have polymorphic relationships backpropagated
 - Clean up simple relationships
 - Clean up polymorphic relationships

## Roadmap

### Pre-Alpha ⬅️ You are here
- [x] Simple relationships
- [x] Clean up simple relationships
- [x] Polymorphic relationships
- [x] Clean up polymorphic relationships
- [ ] Testing with jest 

### Beta 
- [ ] Measure performance gains on large collections
- [ ] Documentation
- [ ] Re-structure project (extract the plugin, help would be appreciated)
- [ ] Allow global configuration

### v1.0
- [ ] Polished Demo case
- [ ] Field level configuration

## Contributors
A big shoutout to [AlessioGr](https://github.com/AlessioGr) for his overall contributions to payload which indirectly made this plugin 
more efficient by introducing the `originalDoc` field in `AfterChange` events 🎉
